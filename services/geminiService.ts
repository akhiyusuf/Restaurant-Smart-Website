import { GoogleGenAI, Type, FunctionDeclaration, ChatSession, GenerateContentResponse, LiveSession, LiveServerMessage, Modality } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, STATIC_IMAGES } from "../constants";
import { CartItem } from "../types";

// Initialize cache with static images, will be populated with AI images as they generate
export const imageCache: Record<string, string> = { ...STATIC_IMAGES };

let chatSession: ChatSession | null = null;

const tools: FunctionDeclaration[] = [
  {
    name: "addToOrder",
    description: "Add a menu item to the user's cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: "The ID of the menu item (e.g., s1, m2).",
        },
        quantity: {
          type: Type.NUMBER,
          description: "The number of items to add.",
        }
      },
      required: ["itemId"],
    },
  },
  {
    name: "removeFromOrder",
    description: "Remove a menu item from the user's cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: "The ID of the menu item to remove.",
        }
      },
      required: ["itemId"],
    },
  }
];

// Helper to safely get the AI client
const getAiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = async (): Promise<boolean> => {
  // Check if keys are available
  const hasKey = !!process.env.API_KEY;
  if (!hasKey) {
    console.warn("API_KEY is missing. Chat features will not work.");
  }
  // Reset session
  chatSession = null;
  return hasKey;
};

export const preloadApp = async (heroDishName: string, heroDescription: string): Promise<boolean> => {
  // Attempt to generate the hero image early if we have a key
  if (!imageCache[heroDishName]) {
      await generateDishImage(heroDishName, heroDescription);
  }
  return true;
};

export const sendMessageToGemini = async (message: string, cartItems: CartItem[] = []): Promise<GenerateContentResponse | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  if (!chatSession) {
    chatSession = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: AI_SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: tools }],
        }
    });
  }

  // 1. Construct System Context based on current cart
  const cartSummary = cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
  const systemContext = `[System Context: Current Cart: ${cartSummary || 'Empty'}. Total Items: ${cartItems.reduce((acc, i) => acc + i.quantity, 0)}]`;
  
  // 2. Append context to user message
  const fullMessage = `${systemContext} ${message}`;

  try {
    const response = await chatSession.sendMessage({ message: fullMessage });
    return response;
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};

export const sendToolResponseToGemini = async (toolResponses: any[]): Promise<GenerateContentResponse | null> => {
  if (!chatSession) return null;

  // Transform UI tool responses to Gemini SDK format
  const parts = toolResponses.map(tr => ({
    functionResponse: {
        name: tr.functionResponse.name,
        response: tr.functionResponse.response,
        id: tr.functionResponse.id
    }
  }));

  try {
     // Fix: sendMessage expects an object with message property
     const response = await chatSession.sendMessage({ message: parts });
     return response;
  } catch (error) {
    console.error("AI Tool Follow-up Error:", error);
    return null;
  }
};

export const generateDishImage = async (dishName: string, description: string): Promise<string | null> => {
  // Return cached image if exists
  if (imageCache[dishName]) return imageCache[dishName];

  const ai = getAiClient();
  if (!ai) {
      return STATIC_IMAGES[dishName] || null;
  }

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
              parts: [
                  { text: `Professional high-end food photography of ${dishName}. ${description}. Michelin star plating, macro detail, cinematic lighting, 8k resolution, photorealistic, depth of field.` }
              ]
          },
          config: {
              imageConfig: {
                  aspectRatio: "1:1",
              }
          }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
              const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              imageCache[dishName] = imageUrl;
              return imageUrl;
          }
      }
      return STATIC_IMAGES[dishName] || null;

  } catch (e) {
      console.error("Image Gen Error:", e);
      // Fail gracefully to static image
      return STATIC_IMAGES[dishName] || null;
  }
};

// --- LIVE API SUPPORT ---

export interface LiveConnectionCallbacks {
  onOpen?: () => void;
  onAudioData: (base64Data: string) => void;
  onToolCall: (toolCall: any) => void;
  onClose?: () => void;
}

export const connectToLiveSession = async (callbacks: LiveConnectionCallbacks): Promise<{ 
  sendAudio: (data: string) => void; 
  sendToolResponse: (toolResponses: any) => void;
  disconnect: () => void;
} | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: tools }],
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
      callbacks: {
        onopen: () => {
          console.log("Live Session Connected");
          callbacks.onOpen?.();
        },
        onmessage: (message: LiveServerMessage) => {
          // Handle Audio
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            callbacks.onAudioData(audioData);
          }

          // Handle Tools
          if (message.toolCall) {
            callbacks.onToolCall(message.toolCall);
          }
        },
        onclose: () => {
          console.log("Live Session Closed");
          callbacks.onClose?.();
        },
        onerror: (err) => {
          console.error("Live Session Error:", err);
          callbacks.onClose?.();
        }
      }
    });

    const session = await sessionPromise;

    return {
      sendAudio: (base64Data: string) => {
        session.sendRealtimeInput({
            media: {
                mimeType: "audio/pcm;rate=16000",
                data: base64Data
            }
        });
      },
      sendToolResponse: (toolResponses: any) => {
        session.sendToolResponse({
            functionResponses: toolResponses
        });
      },
      disconnect: () => {
        session.close();
      }
    };

  } catch (error) {
    console.error("Failed to connect to Live API:", error);
    return null;
  }
};

// Audio Utils for PCM conversion
export const float32ToPCM16 = (float32Arr: Float32Array): string => {
  const int16Arr = new Int16Array(float32Arr.length);
  for (let i = 0; i < float32Arr.length; i++) {
    // Clamp and scale
    const s = Math.max(-1, Math.min(1, float32Arr[i]));
    int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert to binary string then btoa
  let binary = '';
  const bytes = new Uint8Array(int16Arr.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToAudioBuffer = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Arr = new Int16Array(bytes.buffer);
  
  // Convert Int16 to Float32 for Web Audio API
  const float32Arr = new Float32Array(int16Arr.length);
  for (let i = 0; i < int16Arr.length; i++) {
     float32Arr[i] = int16Arr[i] / 32768.0;
  }

  const buffer = ctx.createBuffer(1, float32Arr.length, 24000); // Model output is 24kHz
  buffer.copyToChannel(float32Arr, 0);
  return buffer;
};