import OpenAI from "openai";
import { LLMRequest, LLMResponse } from "../types";
import { config } from "../config";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!config.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const openai = getClient();
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  if (request.system) {
    messages.push({ role: "system", content: request.system });
  }
  
  messages.push({ role: "user", content: request.prompt });
  
  try {
    const response = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 512,
    });
    
    const text = response.choices[0]?.message?.content || "";
    
    return {
      text,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
      raw: response,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
