import { AI_SYSTEM_INSTRUCTION, toolsDeclarations, STATIC_IMAGES } from "../constants";
import { CartItem } from "../types";

// Maintain conversation history in memory for the session
// Groq/OpenAI API is stateless, so we must send history with every request
let chatHistory: any[] = [
  { role: "system", content: AI_SYSTEM_INSTRUCTION }
];

// Initialize cache with static images, will be populated with AI images as they generate
export const imageCache: Record<string, string> = { ...STATIC_IMAGES };

export const initializeChat = async (): Promise<boolean> => {
  // Check if keys are available
  const hasKey = !!process.env.GROQ_API_KEY;
  if (!hasKey) {
    console.warn("GROQ_API_KEY is missing. Chat features will not work.");
  }
  return hasKey;
};

export const preloadApp = async (heroDishName: string, heroDescription: string): Promise<boolean> => {
  // Attempt to generate the hero image early if we have a key
  if (!imageCache[heroDishName]) {
      await generateDishImage(heroDishName, heroDescription);
  }
  return true;
};

export const sendMessageToGemini = async (message: string, cartItems: CartItem[] = []): Promise<any | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
      console.error("GROQ_API_KEY not found");
      return null;
  }

  // 1. Construct System Context based on current cart
  const cartSummary = cartItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
  const systemContext = `[System Context: Current Cart: ${cartSummary || 'Empty'}. Total Items: ${cartItems.reduce((acc, i) => acc + i.quantity, 0)}]`;
  
  // 2. Append context to user message (stateless approach)
  const fullMessage = `${systemContext} ${message}`;

  // 3. Update History
  chatHistory.push({ role: "user", content: fullMessage });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: chatHistory,
        tools: toolsDeclarations,
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API Error: ${err}`);
    }
    
    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    
    // 4. Add assistant response to history
    chatHistory.push(assistantMessage);

    return data;
  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};

export const sendToolResponseToGemini = async (toolResponses: any[]): Promise<any | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // The UI sends us tool results in a specific format, we need to convert them 
  // to the OpenAI "tool" role format for Groq.
  toolResponses.forEach(tr => {
      chatHistory.push({
          role: "tool",
          tool_call_id: tr.functionResponse.id,
          name: tr.functionResponse.name,
          content: JSON.stringify(tr.functionResponse.response)
      });
  });

  try {
     const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: chatHistory,
        tools: toolsDeclarations
      })
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.statusText}`);

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    chatHistory.push(assistantMessage);

    return data;
  } catch (error) {
    console.error("AI Tool Follow-up Error:", error);
    return null;
  }
};

export const generateDishImage = async (dishName: string, description: string): Promise<string | null> => {
  // Return cached image if exists
  if (imageCache[dishName]) return imageCache[dishName];

  const apiKey = process.env.TOGETHER_API_KEY;
  
  // Fallback to static if no key
  if (!apiKey) {
      return STATIC_IMAGES[dishName] || null;
  }

  try {
      // Using black-forest-labs/FLUX.1-dev via Together AI
      const response = await fetch("https://api.together.xyz/v1/images/generations", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              model: "black-forest-labs/FLUX.1-dev",
              prompt: `Professional high-end food photography of ${dishName}. ${description}. Michelin star plating, macro detail, cinematic lighting, 8k resolution, photorealistic, depth of field.`,
              n: 1,
              steps: 28,
              width: 1024,
              height: 1024
          })
      });

      if (!response.ok) {
          throw new Error(`Image Gen Failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Together API standard response for Flux
      const imageUrl = data.data?.[0]?.url;
      
      if (imageUrl) {
          imageCache[dishName] = imageUrl;
          return imageUrl;
      }
      return STATIC_IMAGES[dishName] || null;

  } catch (e) {
      console.error("Image Gen Error:", e);
      // Fail gracefully to static image
      return STATIC_IMAGES[dishName] || null;
  }
};