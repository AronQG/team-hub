import * as dotenv from "dotenv";
import * as path from "path";

// Загружаем .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { generate, LLMProvider } from "../src/llm";

async function testProvider(provider: LLMProvider) {
  console.log(`\nTesting ${provider.toUpperCase()}...`);
  console.log("-".repeat(30));
  
  try {
    const response = await generate(
      {
        system: "You are a helpful assistant. Answer in exactly 3 words.",
        prompt: "What is TypeScript?",
        maxTokens: 50,
        temperature: 0.1,
      },
      provider
    );
    
    console.log("✓ Response:", response.text.trim());
    console.log("  Tokens:", response.usage);
  } catch (error) {
    console.log(`✗ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function main() {
  console.log("=== LLM Provider Integration Test ===");
  
  const providers: LLMProvider[] = ["openai", "anthropic", "gemini"];
  
  for (const provider of providers) {
    await testProvider(provider);
  }
  
  console.log("\n=== Test Complete ===");
}

main();
