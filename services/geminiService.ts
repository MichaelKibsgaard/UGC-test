import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateViralHook = async (topic: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key Missing";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a single, short, punchy, viral "hook" sentence for a TikTok/Reels video about this topic: "${topic}". 
      Keep it under 10 words. Make it controversial or surprising. Return ONLY the text.`,
    });
    
    return response.text.trim() || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating hook.";
  }
};
