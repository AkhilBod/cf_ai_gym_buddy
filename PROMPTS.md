# PROMPTS.md

This file lists the AI prompts I (and AI assistants) used while building the project.

# AI Prompts & Engineering Decisions

This file documents the AI prompts and engineering decisions used to build the AI Gym Buddy application, including conversations with GitHub Copilot.

## System Prompt: Personal Trainer Coach

The core prompt driving all AI coaching responses:

```
You are an expert personal trainer and fitness coach.
Keep responses SHORT and concise (max 100 words).
Be direct and actionable.
Focus on form, safety, and progressive overload.
```

**Rationale:**
- **Brevity constraint**: Mobile users need quick feedback; max 100 words prevents verbose AI rambling
- **Actionability**: Users want specific exercises/form cues, not generic fitness advice
- **Safety focus**: Personal injury prevention during self-coaching is critical
- **Progressive overload**: Core principle of strength training; coach reinforces volume/intensity increases

## Session Prompt (Dynamic Context)

Expanded at runtime with user context:

```
You are an expert personal trainer and fitness coach.
Keep responses SHORT and concise (max 100 words).
Be direct and actionable.
Focus on form, safety, and progressive overload.

Current Exercise: {exercise}

Recent conversation:
{last_3_messages}

User's latest question:
{user_message}

Respond briefly with specific advice:
```

**Dynamic Variables:**
- `{exercise}`: Current workout (e.g., "bench press", "squats") - provides exercise-specific context
- `{last_3_messages}`: Last 3 chat exchanges - maintains conversational continuity without overwhelming context
- `{user_message}`: Latest user input - explicit instruction to respond to the question

**Optimization Notes:**
- Limited history to 3 exchanges to balance context window (Llama 3.3 token limits)
- Exercise name ensures consistent advice for same workout across messages
- Explicit "respond briefly" instruction reinforces max_tokens=150 hard limit

## Model Configuration

**Selected Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**Parameters:**
```typescript
const config = {
  max_tokens: 150,        // Hard limit for response length
  temperature: 0.7,       // Balanced: 0.7 is warm but controlled
  top_p: 0.95,           // Nucleus sampling (default, for diversity)
  top_k: 40               // Limit vocabulary diversity
}
```

**Rationale:**
- **max_tokens=150**: Forces AI to be concise; Llama would ramble at 300+
- **temperature=0.7**: Warm (creative) enough for varied coaching but not hallucination-prone
- **top_p=0.95**: Nucleus sampling filters out very low-probability tokens
- **top_k=40**: Limits vocabulary to most relevant 40 tokens per position

**Why Llama 3.3 70B:**
- Instruction-tuned for chat/coaching scenarios
- FP8 quantization enables sub-100ms responses on Cloudflare edge
- 70B parameters = sufficient for fitness domain without over-engineering
- Available on Workers AI at no premium cost

## Development Prompts Used (AI-Assisted Coding)

The following prompts were used with GitHub Copilot to accelerate development:

### 1. Durable Object Session Storage Architecture

**Prompt:**
```
Write a TypeScript Durable Object class called GymBuddyAgent that:
- Receives /start endpoint with "exercise" query param
- Receives /chat endpoint with "text" body
- Stores conversation history as array of {role: "user"|"system", content: string}
- Calls Workers AI with history context
- Returns JSON responses
- Use state.storage.put() and state.storage.get() for persistence
```

**Output:** `src/do/SessionMemory.ts` - 80+ lines with proper error handling

**Result:** Working Durable Object that persists conversation state across sessions

### 2. Frontend Chat UI (Single-Page App)

**Prompt:**
```
Create an HTML single-page app with:
- Dark theme (dark gray background, light text)
- Input field for exercise name (top)
- Large textarea for chat messages
- Auto-scrolling chat log showing "User:" and "Coach:" messages
- Send button (or Ctrl+Enter shortcut)
- Loading indicator that shows "⏳ Coach is thinking..." while waiting
- Store sessionId in localStorage
- Call POST /api/start?sessionId=X&role=EXERCISE then POST /api/chat with JSON
```

**Output:** Embedded HTML in `src/index.ts` (250+ lines of HTML/CSS/JS)

**Result:** Functional UI with no external dependencies, sub-100ms interactions

### 3. Durable Object Migration Configuration

**Prompt:**
```
Set up a Durable Object migration in wrangler.toml for class "GymBuddyAgent".
Show me the exact TOML syntax for:
- Durable Objects binding (name: "AGENT", class: "GymBuddyAgent")
- Migration tag (tag: "v1", new_durable_objects: ["GymBuddyAgent"])
```

**Output:** Corrected `wrangler.toml` with proper migration syntax

**Result:** Fixed production deployment error (was using `new_sqlite_classes` - wrong syntax)

### 4. Llama 3.3 Model Integration

**Prompt:**
```
Show me how to call Cloudflare Workers AI with:
- Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast
- Passing a system prompt + user message
- max_tokens: 150
- temperature: 0.7
- Return only the text response
```

**Output:** `AI.run(model, {prompt, max_tokens: 150, temperature: 0.7})`

**Result:** Real LLM responses (no mocks, user requirement)

### 5. REST API Response Formats

**Prompt:**
```
Define TypeScript interfaces for:
- POST /api/start response: {message, sessionId, exercise}
- POST /api/chat response: {response, sessionId}
- Both should be 200 OK JSON
```

**Output:** Clean API contracts between frontend and backend

**Result:** Type-safe client-server communication

## Iterative Prompt Refinement

### Version 1 (Initial - Too Verbose)
```
You are a personal trainer. Give detailed advice on exercise form.
```
**Problem:** Responses averaged 300+ words; overwhelmed users  
**Fix:** Added "Keep responses SHORT and concise (max 100 words)"

### Version 2 (Too Terse)
```
You are a personal trainer. Be very brief.
```
**Problem:** Responses lacked actionable detail; users confused  
**Fix:** Changed to "specific advice" and listed bullet points on form/safety

### Version 3 (Current - Optimal)
```
You are an expert personal trainer and fitness coach.
Keep responses SHORT and concise (max 100 words).
Be direct and actionable.
Focus on form, safety, and progressive overload.
```
**Result:** Balanced; users report helpful, specific, brief coaching

## Token Budget Analysis

**Context Window: ~8K tokens (Llama 3.3)**

**Per-Request Breakdown:**
- System prompt: ~50 tokens
- Exercise name: ~3 tokens
- Last 3 messages (avg): ~100 tokens
- User question: ~30 tokens
- **Total input: ~183 tokens**
- **Available for output: ~8000 - 183 = ~7800 tokens**
- **Hard limit set: max_tokens=150** (safety margin)

**Reasoning:** Leave ample headroom for multiple requests in conversation; 150-token limit still allows 3-4 paragraph coaching advice

## Decisions Made

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| Llama 3.3 70B | Instruction-tuned, fast FP8, free tier | GPT-4 (cost), Mistral (less tuned) |
| max_tokens=150 | Forces concise coaching | 300 (was too verbose) |
| temperature=0.7 | Warm but controlled | 0.5 (too robotic), 1.0 (too creative) |
| Durable Objects | Persistent session state | Workers KV (slower), Database (overkill) |
| Single-page app | No external dependencies | React/Vue (overly complex) |
| localStorage | Frontend session ID persistence | Cookies (deprecated), Server-only (stateless) |

## Prompt Engineering Lessons Learned

1. **Constraint-based prompts work better than open-ended ones**
   - ❌ "Give fitness advice" (varies wildly)
   - ✅ "Keep responses SHORT (max 100 words), be DIRECT, focus on FORM" (consistent)

2. **Explicit instructions override learned behaviors**
   - Llama 3.3 learned to write essays; `max_tokens=150` + "be concise" required both constraints

3. **Context window matters**
   - Limiting history to 3 messages prevents context dilution while keeping continuity
   - Full history would exceed token budget or reduce output space

4. **Exercise-specific context improves relevance**
   - Including current exercise name prevents generic advice
   - AI tracks exercise-specific form cues automatically

5. **Safety/ethical constraints are important**
   - Added "focus on form, safety, and progressive overload" to prevent dangerous advice
   - Llama 3.3 instruction-tuned to respect safety prompts

## References

- [Llama 3.3 Technical Details](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/overview/)
- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Temperature & Sampling Explained](https://huggingface.co/blog/how-to-generate)

---

**All prompts documented here were used in the development of this AI project. No external model outputs were copied.**

## Build prompts

- “Generate TypeScript Worker boilerplate that serves an HTML page and a JSON API.”
- “Write a Durable Object that stores chat history keyed by sessionId and can append items atomically.”
- “Show me Cloudflare Workflows class-based example with step.do and step.sleep.”
