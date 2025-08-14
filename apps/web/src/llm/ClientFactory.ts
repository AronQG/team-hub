import { LLMProvider, LLMRequest, LLMResponse } from "./types";
import { config, validateApiKeys } from "./config";
import { callOpenAI } from "./providers/openai";
import { callAnthropic } from "./providers/anthropic";
import { callGemini } from "./providers/gemini";

export async function generate(
  request: LLMRequest,
  provider?: LLMProvider
): Promise<LLMResponse> {
  const selectedProvider = provider ?? (config.PROVIDER as LLMProvider);
  
  // Log for debugging
  console.log(`[LLM] Using provider: ${selectedProvider}`);
  console.log(`[LLM] Request: ${JSON.stringify({ 
    prompt: request.prompt.substring(0, 100) + "...", 
    system: request.system?.substring(0, 50),
    maxTokens: request.maxTokens,
    temperature: request.temperature
  })}`);
  
  const startTime = Date.now();
  
  try {
    let response: LLMResponse;
    
    switch (selectedProvider) {
      case "openai":
        response = await callOpenAI(request);
        break;
      case "anthropic":
        response = await callAnthropic(request);
        break;
      case "gemini":
        response = await callGemini(request);
        break;
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[LLM] Response received in ${duration}ms`);
    console.log(`[LLM] Usage: ${JSON.stringify(response.usage)}`);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LLM] Error after ${duration}ms:`, error);
    throw error;
  }
}

// Export convenience functions for each provider
export async function generateWithOpenAI(request: LLMRequest): Promise<LLMResponse> {
  return generate(request, "openai");
}

export async function generateWithAnthropic(request: LLMRequest): Promise<LLMResponse> {
  return generate(request, "anthropic");
}

export async function generateWithGemini(request: LLMRequest): Promise<LLMResponse> {
  return generate(request, "gemini");
}

// Initialize and validate on module load (for server-side)
if (typeof window === "undefined") {
  try {
    validateApiKeys();
    console.log(`[LLM] Initialized with provider: ${config.PROVIDER}`);
  } catch (error) {
    console.warn(`[LLM] API key validation warning:`, error);
  }
}
