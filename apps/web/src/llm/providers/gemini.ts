import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMRequest, LLMResponse } from "../types";
import { config } from "../config";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!config.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }
    genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
  }
  return genAI;
}

export async function callGemini(request: LLMRequest): Promise<LLMResponse> {
  const ai = getClient();
  const model = ai.getGenerativeModel({ model: config.GEMINI_MODEL });
  
  try {
    const prompt = request.system 
      ? `${request.system}\n\n${request.prompt}` 
      : request.prompt;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxTokens ?? 512,
      },
    });
    
    const response = await result.response;
    const text = response.text();
    
    return {
      text,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
      raw: response,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
