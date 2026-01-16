# 🚀 MistralHub

<div align="center">

![MistralHub Banner](https://img.shields.io/badge/Mistral_AI-Powered-ff6b35?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw0IDdWMTdMOCAyMEwxMiAxN0wxNiAyMEwyMCAxN1Y3TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**A stunning multi-modal AI assistant powered by Mistral AI**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **Real-time Streaming** | Experience instant, token-by-token responses with server-sent events |
| 🖼️ **Vision Analysis** | Upload images and let Pixtral analyze them in detail |
| 📄 **Document Q&A** | Extract text from PDFs and images, then ask questions about the content |
| 🔄 **Model Selection** | Switch between Mistral Large, Medium, Small, Pixtral, and Codestral |
| 📚 **Conversation History** | Your chats are saved locally and persist across sessions |
| 🎨 **Beautiful UI** | Dark theme with glassmorphism, smooth animations, and responsive design |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18.17 or later
- [Mistral AI API Key](https://console.mistral.ai/api-keys) (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mistralhub.git
   cd mistralhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Mistral API key:
   ```env
   MISTRAL_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # Streaming chat endpoint
│   │   ├── vision/        # Image analysis endpoint
│   │   └── document/      # Document OCR & Q&A endpoint
│   ├── globals.css        # Design system & animations
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main chat interface
├── components/
│   ├── ChatMessage.tsx    # Message bubbles with markdown
│   ├── ChatInput.tsx      # Input with file upload
│   ├── ModelSelector.tsx  # Model dropdown
│   └── Sidebar.tsx        # Conversation history
├── lib/
│   ├── mistral.ts         # Mistral client & utilities
│   └── storage.ts         # LocalStorage persistence
└── types/
    └── index.ts           # TypeScript interfaces
```

## 📡 API Reference

### POST `/api/chat`

Stream chat completions from Mistral models.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "mistral-large-latest"
}
```

**Response:** Server-sent events with streamed content.

---

### POST `/api/vision`

Analyze images using Pixtral.

**Request:**
```json
{
  "image": "base64_encoded_image",
  "prompt": "Describe this image",
  "model": "pixtral-large-latest"
}
```

**Response:**
```json
{
  "content": "This image shows..."
}
```

---

### POST `/api/document`

Extract text from documents and answer questions.

**Request:**
```json
{
  "document": "base64_encoded_pdf_or_image",
  "prompt": "What is the main topic?",
  "model": "mistral-large-latest"
}
```

**Response:**
```json
{
  "extractedText": "Document content...",
  "answer": "The main topic is..."
}
```

## 🎨 Design System

The app features a carefully crafted dark theme:

- **Colors:** Deep space blacks, Mistral orange (#ff6b35), purple accents
- **Effects:** Glassmorphism, subtle glows, smooth animations
- **Typography:** Inter font family with clean hierarchy
- **Components:** Consistent spacing, responsive breakpoints

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

## 🌟 Models Supported

| Model | Best For | Vision | Docs |
|-------|----------|--------|------|
| **Mistral Large** | Complex reasoning, detailed analysis | ❌ | ✅ |
| **Mistral Medium** | Balanced performance | ❌ | ✅ |
| **Mistral Small** | Fast, simple tasks | ❌ | ❌ |
| **Pixtral Large** | Image understanding | ✅ | ✅ |
| **Codestral** | Code generation | ❌ | ❌ |

## 📝 Example Prompts

Try these to explore MistralHub's capabilities:

- **Chat:** "Explain the difference between REST and GraphQL APIs"
- **Vision:** Upload an image and ask "What objects are in this image?"
- **Document:** Upload a PDF and ask "Summarize the key points"
- **Code:** "Write a Python function to calculate Fibonacci numbers"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own applications.

---

<div align="center">

**Built with ❤️ for Mistral AI**

[Mistral AI Documentation](https://docs.mistral.ai/) • [API Reference](https://docs.mistral.ai/api/)

</div>
