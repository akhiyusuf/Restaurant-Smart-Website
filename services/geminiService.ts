import { GoogleGenAI, Chat, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, toolsDeclarations, STATIC_IMAGES } from "../constants";
import { CartItem } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Maintain a persistent chat session for the duration of the app
let chatSession: Chat | null = null;

// Initialize cache with static images, will be populated with AI images as they generate
export const imageCache: Record<string, string> = { ...STATIC_IMAGES };

export const initializeChat = async (): Promise<boolean> => {
  return !!apiKey;
};

// Lazy initialization of the chat session
const getChatSession = () => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        // @ts-ignore - The SDK types for FunctionDeclaration match but sometimes TS inference on arrays can be strict
        tools: [{ functionDeclarations: toolsDeclarations }],
      },
    });
  }
  return chatSession;
};

export const preloadApp = async (heroDishName: string, heroDescription: string): Promise<boolean> => {
  // Attempt to generate the hero image early if we have a key
  if (!imageCache[heroDishName]) {
      await generateDishImage(heroDishName, heroDescription);
  }
  return true;
};

export const sendMessageToGemini = async (message: string, cartItems: CartItem[] = []): Promise<GenerateContentResponse | null> => {
  if (!apiKey) {
      console.error("API_KEY not found");
      return null;
  }

  try {
    const session = getChatSession();

    // 1. Construct System Context based on current cart
    const cartSummary = cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
    const systemContext = `[System Context: Current Cart: ${cartSummary || 'Empty'}. Total Items: ${cartItems.reduce((acc, i) => acc + i.quantity, 0)}]`;
    
    // 2. Append context to user message
    // Note: In a persistent chat, we might repeat context, but it ensures the model knows the *latest* cart state.
    const fullMessage = `${systemContext} ${message}`;

    // 3. Send Message
    const response = await session.sendMessage({ message: fullMessage });
    
    return response;
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};

export const sendToolResponseToGemini = async (toolResponses: any[]): Promise<GenerateContentResponse | null> => {
  if (!apiKey) return null;

  try {
    const session = getChatSession();
    
    // Map the UI tool responses to the SDK's expected part format
    // toolResponses comes from AIChat.tsx as: { functionResponse: { name, response, id } }
    const response = await session.sendMessage(toolResponses);

    return response;
  } catch (error) {
    console.error("AI Tool Follow-up Error:", error);
    return null;
  }
};

export const generateDishImage = async (dishName: string, description: string): Promise<string | null> => {
  // Return cached image if exists
  if (imageCache[dishName]) return imageCache[dishName];

  // Fallback to static if no key
  if (!apiKey) {
      return STATIC_IMAGES[dishName] || null;
  }

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Professional high-end food photography of ${dishName}. ${description}. Michelin star plating, macro detail, cinematic lighting, 8k resolution, photorealistic, depth of field.` }
          ]
        }
      });

      // Find image part
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64String = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const imageUrl = `data:${mimeType};base64,${base64String}`;
            imageCache[dishName] = imageUrl;
            return imageUrl;
          }
        }
      }
      
      return STATIC_IMAGES[dishName] || null;

  } catch (e) {
      console.error("Image Gen Error:", e);
      // Fail gracefully to static image
      return STATIC_IMAGES[dishName] || null;
  }
};
