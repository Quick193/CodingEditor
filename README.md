# IDE Project

A modern code editor with AI-powered features built with React and Vite.

## Features

- Code editor with syntax highlighting
- File management with localStorage persistence
- AI-powered code completion, refactoring, and debugging
- Real-time chat assistant
- Code execution and testing

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Base44 API (optional but recommended):**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Base44 API credentials:
   ```
   VITE_BASE44_API_URL=https://api.base44.com/v1
   VITE_BASE44_API_KEY=your_api_key_here
   VITE_BASE44_PROJECT_ID=your_project_id_here
   ```
   
   **Getting Your API Key:**
   - Visit [Base44 Dashboard](https://dashboard.base44.com)
   - Go to API Keys section
   - Generate a new API key
   - Copy the key to your `.env` file

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## AI Provider Integration

The application supports multiple AI providers (OpenAI, Anthropic Claude, Google Gemini) for AI-powered features. Without API configuration, the app will work with mock responses stored in localStorage.

### Supported AI Providers:
- **OpenAI** (GPT-4, GPT-3.5) - Recommended, most flexible
- **Anthropic Claude** (Claude 3.5 Sonnet) - Great for code analysis
- **Google Gemini** (Gemini Pro) - Alternative option

### Available AI Features:
- **Code Completion**: Get AI suggestions to complete your code
- **Code Refactoring**: Receive optimization suggestions
- **Error Debugging**: Get explanations and fixes for errors
- **Chat Assistant**: Ask questions about your code

### API Configuration

1. **Choose your AI provider** and get an API key:
   - **OpenAI**: Visit [platform.openai.com](https://platform.openai.com) → API Keys
   - **Anthropic**: Visit [console.anthropic.com](https://console.anthropic.com) → API Keys
   - **Google**: Visit [makersuite.google.com](https://makersuite.google.com) → API Keys

2. **Configure in `.env` file**:
   ```env
   VITE_AI_PROVIDER=openai
   VITE_OPENAI_API_KEY=sk-...
   ```

The AI client automatically detects if API credentials are configured:
- If configured: Makes real API calls to your chosen provider
- If not configured: Falls back to localStorage with mock responses

Check the browser console for API status messages.

## File Storage

Files are stored in browser localStorage by default. When Base44 API is configured, files can optionally be synced to the cloud.

## Development

- Uses Vite for fast development
- React Query for data management
- Tailwind CSS for styling
- Radix UI components

