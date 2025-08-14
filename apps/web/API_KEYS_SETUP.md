# 🔑 Настройка API ключей для LLM

## 📍 Где добавить ключи

**Путь к файлу:** `D:\team-hub\apps\web\.env.local`

## 📝 Шаги настройки

### 1. Создайте файл `.env.local` в папке `apps/web/`

### 2. Скопируйте следующее содержимое:

```env
# ========================================
# LLM Provider Configuration
# ========================================

# Выберите провайдера по умолчанию: openai | anthropic | gemini
LLM_PROVIDER=openai

# ========================================
# API КЛЮЧИ - ЗАМЕНИТЕ xxx НА ВАШИ РЕАЛЬНЫЕ КЛЮЧИ
# ========================================

# OpenAI API Key
# Получить здесь: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Anthropic API Key  
# Получить здесь: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Google Gemini API Key
# Получить здесь: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxx

# ========================================
# МОДЕЛИ (опционально, можно оставить по умолчанию)
# ========================================
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
GEMINI_MODEL=gemini-1.5-pro

# ========================================
# ДРУГИЕ НАСТРОЙКИ ПРОЕКТА (если нужны)
# ========================================
DATABASE_URL=file:../../packages/db/prisma/dev.db
JWT_SECRET=your-jwt-secret-here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Замените `xxx` на ваши реальные API ключи

### 4. Сохраните файл

## 🚀 Проверка работы

После добавления ключей выполните:

```bash
cd apps/web
npm run llm:test
```

## 📊 Где получить API ключи

| Провайдер | Ссылка для получения ключа | Формат ключа |
|-----------|---------------------------|--------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `sk-proj-...` |
| **Anthropic** | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | `sk-ant-...` |
| **Google Gemini** | [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) | `AIza...` |

## ⚠️ Важно

- Файл `.env.local` автоматически игнорируется Git (не попадёт в репозиторий)
- Не делитесь вашими API ключами
- Для production используйте переменные окружения сервера

## 🔄 Смена провайдера

Вы можете менять провайдера двумя способами:

1. **Через переменную окружения:**
   ```env
   LLM_PROVIDER=anthropic  # или openai, или gemini
   ```

2. **В коде при вызове:**
   ```typescript
   await generate(request, "anthropic");
   ```

## ❓ Проблемы?

Если тест не работает, проверьте:
1. Правильность API ключа
2. Наличие средств на счету провайдера
3. Доступность API в вашем регионе
