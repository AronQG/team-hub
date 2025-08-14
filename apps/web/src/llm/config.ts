import { z } from "zod";

export const configSchema = z.object({
  PROVIDER: z.enum(["openai", "anthropic", "gemini"]).default("openai"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  GEMINI_MODEL: z.string().default("gemini-1.5-pro"),
});

export const config = configSchema.parse({
  PROVIDER: process.env.LLM_PROVIDER || process.env.NEXT_PUBLIC_LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || process.env.NEXT_PUBLIC_ANTHROPIC_MODEL,
  GEMINI_MODEL: process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL,
});

export function validateApiKeys() {
  const errors: string[] = [];
  
  if (config.PROVIDER === "openai" && !config.OPENAI_API_KEY) {
    errors.push("OPENAI_API_KEY is required for OpenAI provider");
  }
  
  if (config.PROVIDER === "anthropic" && !config.ANTHROPIC_API_KEY) {
    errors.push("ANTHROPIC_API_KEY is required for Anthropic provider");
  }
  
  if (config.PROVIDER === "gemini" && !config.GOOGLE_API_KEY) {
    errors.push("GOOGLE_API_KEY is required for Gemini provider");
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
}
