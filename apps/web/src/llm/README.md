# LLM Integration Layer

Unified integration layer for multiple LLM providers (OpenAI, Anthropic, Google Gemini).

## Features

- ✅ Single interface for all providers
- ✅ Environment-based configuration
- ✅ TypeScript support with full typing
- ✅ Automatic API key validation
- ✅ Request/response logging
- ✅ Error handling

## Setup

1. Copy environment variables:
```bash
cp .env.llm.example .env.local
```

2. Add your API keys to `.env.local`:
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GOOGLE_API_KEY=your-key
```

3. Install dependencies (already done):
```bash
npm install
```

## Usage

### Basic usage

```typescript
import { generate } from '@/llm';

const response = await generate({
  prompt: "What is TypeScript?",
  system: "You are a helpful assistant",
  maxTokens: 100,
  temperature: 0.7
});

console.log(response.text);
```

### Using specific provider

```typescript
import { generate } from '@/llm';

const response = await generate(
  { prompt: "Hello!" },
  "anthropic" // or "openai" or "gemini"
);
```

### In API routes (Next.js)

```typescript
// app/api/chat/route.ts
import { generate } from '@/llm';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  const response = await generate({
    prompt,
    system: "You are a helpful assistant"
  });
  
  return Response.json({ text: response.text });
}
```

## Testing

```bash
# Test default provider
npm run llm:test

# Test all providers
npm run llm:test-all

# Test specific provider
npm run llm:openai
npm run llm:anthropic
npm run llm:gemini
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Default provider | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `GOOGLE_API_KEY` | Google API key | - |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `ANTHROPIC_MODEL` | Anthropic model | `claude-3-5-sonnet-latest` |
| `GEMINI_MODEL` | Gemini model | `gemini-1.5-pro` |

## API Reference

### Types

```typescript
interface LLMRequest {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  text: string;
  usage?: Record<string, number>;
  raw?: unknown;
}

type LLMProvider = "openai" | "anthropic" | "gemini";
```

### Functions

- `generate(request: LLMRequest, provider?: LLMProvider): Promise<LLMResponse>`
- `generateWithOpenAI(request: LLMRequest): Promise<LLMResponse>`
- `generateWithAnthropic(request: LLMRequest): Promise<LLMResponse>`
- `generateWithGemini(request: LLMRequest): Promise<LLMResponse>`
