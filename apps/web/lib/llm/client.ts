import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateText } from 'ai'
import { LLMModel, LLMMessage, MODEL_PROVIDERS } from './types'

// Проверяем наличие API ключей при инициализации
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set. OpenAI models will not work.')
}

if (!ANTHROPIC_API_KEY) {
  console.warn('ANTHROPIC_API_KEY not set. Anthropic models will not work.')
}

if (!GOOGLE_API_KEY) {
  console.warn('GOOGLE_API_KEY not set. Google models will not work.')
}

const openai = OPENAI_API_KEY ? createOpenAI({
  apiKey: OPENAI_API_KEY,
}) : null

const anthropic = ANTHROPIC_API_KEY ? createAnthropic({
  apiKey: ANTHROPIC_API_KEY,
}) : null

const google = GOOGLE_API_KEY ? createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
}) : null

export async function generateLLMResponse(
  model: LLMModel,
  messages: LLMMessage[],
  stream: boolean = false
) {
  const provider = MODEL_PROVIDERS[model]
  
  let aiModel
  switch (provider) {
    case 'openai':
      if (!openai) {
        throw new Error('OpenAI API key not configured')
      }
      aiModel = openai(model)
      break
    case 'anthropic':
      if (!anthropic) {
        throw new Error('Anthropic API key not configured')
      }
      aiModel = anthropic(model)
      break
    case 'google':
      if (!google) {
        throw new Error('Google API key not configured')
      }
      aiModel = google(model)
      break
    default:
      throw new Error(`Unknown provider for model ${model}`)
  }

  try {
    if (stream) {
      return await streamText({
        model: aiModel,
        messages,
        temperature: 0.7,
        maxTokens: 2048,
      })
    }

    const result = await generateText({
      model: aiModel,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    })

    return {
      content: result.text,
      usage: result.usage,
    }
  } catch (error) {
    console.error(`Error generating LLM response with model ${model}:`, error)
    
    // Преобразуем ошибки в более понятные сообщения
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(`Invalid API key for ${provider}`)
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error(`Rate limit exceeded for ${provider}`)
      }
      if (error.message.includes('model')) {
        throw new Error(`Model ${model} not available`)
      }
    }
    
    throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}