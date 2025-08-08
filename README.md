# Allivo - AI Presentation Assistant

Allivo is an intelligent presentation preparation assistant that guides you through creating compelling presentations. Using conversational AI, it helps you clarify your presentation's subject, purpose, audience, and core message through a natural dialogue interface.

## Features

- 🎯 **Guided Workflow**: Step-by-step guidance to define your presentation's key elements
- 🌐 **Multilingual Support**: Automatically detects and responds in your language
- 💬 **Natural Conversation**: Chat-based interface that feels like talking to a presentation coach
- 📊 **Progress Tracking**: Visual progress indicators showing your preparation status
- 🎨 **Smart Suggestions**: Context-aware suggestions to help you move forward
- 📝 **Structured Output**: Organizes your ideas into actionable presentation structures

## How It Works

Allivo guides you through five essential questions to prepare your presentation:

1. **What's your topic?** - Define what you're presenting about
2. **What's your goal?** - Clarify what you want to achieve
3. **Who's your audience?** - Identify who will be listening
4. **What's your core message?** - Distill your key takeaway
5. **Choose your structure** - Select the best story flow for your content

## Getting Started

### Prerequisites

- Node.js 22+ 
- Yarn package manager
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/allivo.git
cd allivo
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
# Create a .env file in the root directory
echo "NUXT_OPENAI_API_KEY=your_openai_api_key_here" > .env
```

4. Initialize the database (happens automatically on first run):
```bash
yarn dev
```

### Development

Start the development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build for production:
```bash
yarn build
```

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Nitro Server
- **Database**: SQLite (local) / Cloudflare D1 (production)
- **AI**: OpenAI GPT-4 via Cloudflare AI Gateway

## Project Structure

```
allivo/
├── app/              # Frontend Vue components and pages
├── server/           # Backend API and database logic
│   ├── api/         # API endpoints
│   ├── utils/       # Utility functions and AI integration
│   └── tasks/       # Database initialization
├── shared/          # Shared TypeScript types
└── public/          # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Proprietary - All rights reserved