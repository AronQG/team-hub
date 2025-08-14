import * as dotenv from "dotenv";
import * as path from "path";

// Загружаем .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { generate } from "../src/llm/ClientFactory";
import { config } from "../src/llm/config";

async function main() {
  try {
    console.log(`Testing LLM provider: ${config.PROVIDER}`);
    console.log(`Model: ${config[`${config.PROVIDER.toUpperCase()}_MODEL` as keyof typeof config]}`);
    console.log("---");
    
    const response = await generate({
      system: "You are a helpful assistant. Be concise.",
      prompt: "Say 'ok' in one word.",
    });
    
    console.log("Response:", response.text.trim());
    
    if (response.usage) {
      console.log("Token usage:", response.usage);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
