# LLM Integration Setup Guide

## Quick Start

1. **Configure API Keys**
   
   Create `.env.local` file in `apps/web/`:
   ```env
   # Required: Add at least one API key
   LLM_PROVIDER=openai  # or anthropic or gemini
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=AIza...
   ```

2. **Test Integration**
   ```bash
   cd apps/web
   npm run llm:test
   ```

## File Structure
```
apps/web/
├── src/llm/
│   ├── types.ts           # Type definitions
│   ├── config.ts          # Configuration & validation
│   ├── ClientFactory.ts   # Main interface
│   ├── index.ts          # Exports
│   └── providers/
│       ├── openai.ts     # OpenAI implementation
│       ├── anthropic.ts  # Anthropic implementation
│       └── gemini.ts     # Gemini implementation
├── examples/
│   ├── quickcheck.ts     # Basic test
│   └── test-all-providers.ts  # Test all providers
└── .env.llm.example      # Environment template
```

## Available Commands
- `npm run llm:test` - Test default provider
- `npm run llm:test-all` - Test all providers
- `npm run llm:openai` - Test OpenAI
- `npm run llm:anthropic` - Test Anthropic
- `npm run llm:gemini` - Test Gemini

## Integration Example

```typescript
// In your Next.js API route or server component
import { generate } from '@/llm';

const response = await generate({
  prompt: "Your question here",
  system: "System prompt",
  maxTokens: 500,
  temperature: 0.7
});

console.log(response.text);
```

## Switching Providers

Runtime:
```typescript
const response = await generate(request, "anthropic");
```

Environment:
```env
LLM_PROVIDER=gemini
```
