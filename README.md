# AI Gym Buddy - Cloudflare AI-Powered Application

An intelligent, real-time fitness coaching application built on Cloudflare Workers with the Llama 3.3 LLM. Get personalized workout advice, form corrections, and motivational coaching powered by AI.

## Assignment Requirements Met

This project satisfies all Cloudflare AI assignment requirements:

[https://cf_ai_interview_coach.akkiisan9.workers.dev/
](url)- ✅ **LLM Component**: Llama 3.3 70B Instruct FP8 Fast via Cloudflare Workers AI
- ✅ **Workflow/Coordination**: Cloudflare Agents + Durable Objects for stateful AI sessions
- ✅ **User Input**: Real-time chat interface with instant AI responses
- ✅ **Memory/State**: Persistent conversation history per user session using Durable Objects


### Components

1. **Worker (src/index.ts)**
   - REST API endpoints: `/api/start`, `/api/chat`
   - Durable Object orchestration via `env.AGENT`
   - Single-page application HTML + vanilla JavaScript

2. **Durable Object (src/do/SessionMemory.ts)**
   - Class: `GymBuddyAgent` extends `DurableObject`
   - Endpoints:
     - `POST /start`: Initialize workout session with exercise
     - `POST /chat`: Send user message, receive AI coaching
   - Persistent storage: Conversation history + current exercise

3. **Workers AI**
   - Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
   - Context: Personal trainer coaching prompt
   - Config: max_tokens=150, temperature=0.7 (concise responses)

## Quick Start

### Prerequisites

- Node.js 18+ with npm
- Cloudflare account (free tier supported)
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/AkhilBod/cf_ai_gym_buddy.git
   cd cf_ai_gym_buddy
   npm install
   ```

2. **Configure Cloudflare credentials:**
   ```bash
   wrangler login
   ```

3. **Run local development server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:8787` in your browser

4. **Test the app:**
   - Enter a workout (e.g., "bench press")
   - Type a question (e.g., "How do I improve my form?")
   - Press Ctrl+Enter or click Send
   - Receive AI coaching from your personal trainer

### Production Deployment

1. **Update project name in wrangler.toml** (if needed):
   ```bash
   # Change 'name = "cf_ai_gym_buddy"' as desired
   ```

2. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

3. **Access live application:**
   - Check terminal output for deployment URL
   - Example: `https://cf-ai-gym-buddy.your-account.workers.dev`

##  API Endpoints

### POST /api/start
Initialize a new workout session.

**Query Parameters:**
- `sessionId` (string): Unique session identifier (UUID)
- `role` (string, optional): Exercise name (e.g., "bench press", "squats")

**Example:**
```bash
curl -X POST "http://localhost:8787/api/start?sessionId=user123&role=bench%20press"
```

**Response (200 OK):**
```json
{
  "message": "Let's work on bench press! What do you need help with?",
  "sessionId": "user123",
  "exercise": "bench press"
}
```

### POST /api/chat
Send a message to the AI gym coach.

**Request Body:**
```json
{
  "sessionId": "user123",
  "text": "How do I improve my form?"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8787/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","text":"How do I improve my form?"}'
```

**Response (200 OK):**
```json
{
  "response": "Great question! Focus on these key points:\n1. Keep your chest high and squeeze shoulder blades\n2. Lower the bar in a controlled 2-3 second tempo\n3. Touch chest lightly, don't bounce\n4. Drive with legs for stability\n\nTry 3x5 reps with controlled form over heavy weight. Report back!",
  "sessionId": "user123"
}
```


##  Development

### Project Structure
```
cf_ai_gym_buddy/
├── src/
│   ├── index.ts                 # Main Worker entry point
│   └── do/
│       └── SessionMemory.ts    # Durable Object for session state
├── wrangler.toml               # Cloudflare Worker configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies & scripts
├── README.md                   # This file
└── PROMPTS.md                  # AI prompts used (assignment requirement)
```

### Build and Run Scripts

```bash
npm run dev      # Start local development server
npm run build    # Compile TypeScript
npm run deploy   # Deploy to Cloudflare (requires login)
```

### Configuration

**wrangler.toml** key settings:
```toml
name = "cf_ai_gym_buddy"
main = "src/index.ts"
compatibility_flags = ["nodejs_compat"]

[durable_objects]
bindings = [{ name = "AGENT", class_name = "GymBuddyAgent" }]

[[migrations]]
tag = "v1"
new_durable_objects = ["GymBuddyAgent"]

[ai]
binding = "AI"
```

## AI Model & Prompting

### Model Selection: Llama 3.3 70B Instruct FP8 Fast

- **Choice**: Llama 3.3 because it excels at instruction-following and conversational context
- **Speed**: FP8 quantization enables sub-second responses on Cloudflare edge
- **Quality**: 70B parameter size balances accuracy with inference cost

### System Prompt

The AI operates under this coaching-focused system prompt:

```
You are an expert personal trainer and fitness coach.
Keep responses SHORT and concise (max 100 words).
Be direct and actionable.
Focus on form, safety, and progressive overload.
```

The prompt is optimized for:
- **Brevity**: max_tokens=150, explicit "max 100 words" instruction
- **Context**: Includes current exercise + last 3 conversation exchanges
- **Personality**: Encouraging but direct coaching style
- **Safety**: Emphasizes proper form and injury prevention

See `PROMPTS.md` for detailed prompt engineering notes.

## Troubleshooting

### "Coach is thinking..." stays forever
- Check network connection
- Verify Cloudflare credentials: `wrangler whoami`
- Check Wrangler logs: `wrangler logs`

### 500 error on /api/chat
- Ensure Durable Object was initialized via `/api/start` first
- Check that a valid sessionId is being sent
- View debug logs: `wrangler tail`

### App deployed but no AI responses
- Verify Workers AI is enabled in Cloudflare dashboard
- Check that account has AI subrequests available
- Confirm `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model is available

##  Assignment Instructions Compliance

✅ **Repository Naming**: Prefixed with `cf_ai_` (cf_ai_gym_buddy)  
✅ **README.md**: Comprehensive documentation with setup and API guides  
✅ **PROMPTS.md**: AI prompts and engineering decisions documented  
✅ **All Components**: LLM + Workflow + User Input + Memory implemented  
✅ **Original Work**: No copying from other submissions  
✅ **GitHub Access**: Public repository with live deployment link  

##  Resources & Documentation

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers AI Models & Pricing](https://developers.cloudflare.com/workers-ai/models/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Agents](https://developers.cloudflare.com/agents/)
- [Llama 3.3 Model Card](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)

##  Deployment Status

- **Live URL**: https://cf-ai-gym-buddy.akkiisan9.workers.dev
- **Status**: ✅ Deployed and operational
- **Testing**: Use curl examples above or visit live URL in browser

##  License

Original project for Cloudflare assignment. All work is original.

---

**Questions or issues?** Review the troubleshooting section or check Cloudflare's official documentation linked above.
