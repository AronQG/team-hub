export type LLMProvider = 'openai' | 'anthropic' | 'google'
export type LLMModel = 
  | 'gpt-4-turbo-preview'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'gemini-pro'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  model: LLMModel
  messages: LLMMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface LLMResponse {
  content: string
  model: LLMModel
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export const MODEL_PROVIDERS: Record<LLMModel, LLMProvider> = {
  'gpt-4-turbo-preview': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-3-opus-20240229': 'anthropic',
  'claude-3-sonnet-20240229': 'anthropic',
  'gemini-pro': 'google',
}