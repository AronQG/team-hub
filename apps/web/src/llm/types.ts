export type LLMProvider = "openai" | "anthropic" | "gemini";

export interface LLMRequest {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
  usage?: Record<string, number>;
  raw?: unknown;
}

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
}
