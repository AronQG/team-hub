# Team Hub

Современная платформа для командной работы с интеграцией AI-ассистентов, управлением задачами и обменом файлами.

## 🚀 Возможности

- **AI-чаты** - Интеграция с OpenAI GPT, Anthropic Claude и Google Gemini
- **Kanban доска** - Управление задачами с drag-and-drop
- **Файловое хранилище** - Безопасное хранение файлов в AWS S3
- **Аутентификация** - JWT-based аутентификация с bcrypt хешированием
- **Реальные чаты** - Обмен сообщениями в реальном времени
- **Система приглашений** - Приглашение пользователей по токенам

## 🛠 Технологии

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: SQLite (разработка), PostgreSQL (продакшн)
- **AI**: OpenAI, Anthropic, Google AI
- **Хранилище**: AWS S3
- **Аутентификация**: JWT, bcrypt
- **Мониторинг**: Turbo для монорепозитория

## 📋 Требования

- Node.js 20+
- npm 10+
- AWS S3 bucket (для файлов)
- API ключи для AI провайдеров

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd team-hub
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env.local`:

```bash
cp env.example .env.local
```

Заполните необходимые переменные:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
HASH_SALT_ROUNDS=12

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# AI Providers (хотя бы один должен быть настроен)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GOOGLE_API_KEY="your-google-api-key"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"

# Environment
NODE_ENV="development"
```

### 4. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение схемы к базе данных
npm run db:push
```

### 5. Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## 🏗 Структура проекта

```
team-hub/
├── apps/
│   └── web/                 # Next.js веб-приложение
│       ├── app/            # App Router
│       ├── components/     # React компоненты
│       ├── lib/           # Утилиты и конфигурация
│       └── api/           # API endpoints
├── packages/
│   └── db/                # Prisma схема и клиент
├── docker/                # Docker конфигурация
└── .github/               # GitHub Actions
```

## 🔧 API Endpoints

### Аутентификация
- `POST /api/auth/signup` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/logout` - Выход из системы

### Чаты
- `GET /api/chats` - Получение списка чатов
- `POST /api/chats` - Создание нового чата
- `GET /api/chats/[id]/messages` - Получение сообщений чата
- `POST /api/chats/[id]/messages` - Отправка сообщения

### AI
- `POST /api/llm/chat` - Запрос к AI модели

### Задачи
- `GET /api/kanban` - Получение задач
- `POST /api/kanban` - Создание задачи
- `PUT /api/kanban` - Обновление задачи
- `DELETE /api/kanban` - Удаление задачи

### Файлы
- `POST /api/files` - Загрузка файла
- `GET /api/files` - Получение списка файлов

## 🔒 Безопасность

- JWT токены с ограниченным временем жизни
- bcrypt хеширование паролей
- Валидация входных данных с Zod
- CORS защита
- Заголовки безопасности
- Проверка прав доступа к ресурсам

## 🚀 Развертывание

### Docker

```bash
# Сборка образа
docker build -t team-hub .

# Запуск контейнера
docker run -p 3000:3000 team-hub
```

### Docker Compose

```bash
docker-compose up -d
```

### Vercel

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Деплой автоматически запустится

## 🧪 Тестирование

```bash
# Запуск линтера
npm run lint

# Проверка типов TypeScript
npx tsc --noEmit
```

## 📝 Миграции базы данных

```bash
# Создание миграции
npm run db:migrate

# Применение миграций
npm run db:push
```

## 🔧 Конфигурация

### AI Провайдеры

Поддерживаются следующие AI модели:

**OpenAI:**
- GPT-4 Turbo
- GPT-3.5 Turbo

**Anthropic:**
- Claude 3 Opus
- Claude 3 Sonnet

**Google:**
- Gemini Pro

### Файловое хранилище

Файлы хранятся в AWS S3 с подписанными URL для безопасного доступа.

Поддерживаемые типы файлов:
- Изображения: JPEG, PNG, GIF, WebP
- Документы: PDF, TXT, CSV, JSON, XML, Markdown
- Архивы: ZIP

Максимальный размер файла: 50MB

## 🐛 Устранение неполадок

### Проблемы с базой данных

```bash
# Сброс базы данных
rm -rf packages/db/dev.db
npm run db:push
```

### Проблемы с AI

1. Проверьте API ключи в переменных окружения
2. Убедитесь, что у вас есть кредиты на AI сервисах
3. Проверьте лимиты запросов

### Проблемы с файлами

1. Проверьте настройки AWS S3
2. Убедитесь, что bucket существует и доступен
3. Проверьте права доступа AWS IAM

## 📄 Лицензия

MIT License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте Issue в репозитории.
