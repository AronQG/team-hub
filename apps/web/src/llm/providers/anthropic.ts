import Anthropic from "@anthropic-ai/sdk";
import { LLMRequest, LLMResponse } from "../types";
import { config } from "../config";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export async function callAnthropic(request: LLMRequest): Promise<LLMResponse> {
  const anthropic = getClient();
  
  try {
    const params: any = {
      model: config.ANTHROPIC_MODEL,
      max_tokens: request.maxTokens ?? 512,
      temperature: request.temperature ?? 0.2,
      messages: [
        {
          role: "user",
          content: request.prompt,
        },
      ],
    };
    
    if (request.system) {
      params.system = request.system;
    }
    
    const response = await anthropic.messages.create(params);
    
    let text = "";
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      }
    }
    
    return {
      text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      raw: response,
    };
  } catch (error) {
    console.error("Anthropic API error:", error);
    throw new Error(`Anthropic API failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
