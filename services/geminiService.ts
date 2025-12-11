import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, toolsDeclarations, MENU_ITEMS } from "../constants";
import { CartItem } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;
export const imageCache: Record<string, string> = {};

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const initializeChat = async (): Promise<boolean> => {
  const ai = getGenAI();
  try {
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: [{ functionDeclarations: toolsDeclarations }]
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return false;
  }
};

const generateBackgroundMenuImages = async () => {
  // Generate Menu Images Sequentially with Rate Limiting
  // Gemini Free Tier is approx 15 RPM.
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i];
    
    // Skip if already cached
    if (imageCache[item.name]) continue;

    try {
      await generateDishImage(item.name, item.description);
    } catch (e) {
      console.warn(`Failed to generate image for ${item.name}`, e);
    }

    // Add delay between requests
    if (i < MENU_ITEMS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }
};

export const preloadApp = async (heroDishName: string, heroDescription: string): Promise<boolean> => {
  // Initialize Chat in background
  const chatPromise = initializeChat();
  
  // 1. Generate Hero Image (Priority - Block loading screen for this)
  await generateDishImage(heroDishName, heroDescription);
  
  // 2. Start background generation for the rest (Do not await)
  generateBackgroundMenuImages();

  // Ensure chat is ready before finishing
  await chatPromise;
  
  return !!chatSession;
};

// Now returns the full response object to handle function calls in the UI
export const sendMessageToGemini = async (message: string, cartItems: CartItem[] = []): Promise<GenerateContentResponse | null> => {
  if (!chatSession) {
    const success = await initializeChat();
    if (!success) return null;
  }

  if (!chatSession) {
    return null;
  }

  // Inject Context about the cart
  const cartSummary = cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
  const context = `[System Context: Current Cart contains ${cartItems.length} distinct items. Items: ${cartSummary || 'Empty'}. Total Items: ${cartItems.reduce((acc, i) => acc + i.quantity, 0)}].`;
  const fullMessage = `${context} ${message}`;

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: fullMessage,
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const sendToolResponseToGemini = async (toolResponses: any[]): Promise<GenerateContentResponse | null> => {
  if (!chatSession) return null;
  if (!toolResponses || toolResponses.length === 0) {
    console.error("Attempted to send empty tool response");
    return null;
  }
  
  try {
    const response = await chatSession.sendMessage({ message: toolResponses });
    return response;
  } catch (error) {
    console.error("Gemini Tool Response Error:", error);
    return null;
  }
};

export const generateDishImage = async (dishName: string, description: string): Promise<string | null> => {
  // Check cache first
  if (imageCache[dishName]) return imageCache[dishName];

  const ai = getGenAI();
  try {
    const prompt = `Professional food photography of ${dishName}, ${description}. High end fine dining, soft lighting, 8k resolution, photorealistic, plated beautifully on ceramic.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        imageCache[dishName] = url; // Cache the result
        return url;
      }
    }
    return null;
  } catch (error) {
    // We log but don't throw, allowing the app to continue without the image
    console.error(`Image Gen Error for ${dishName}:`, error);
    return null;
  }
};