# cf_ai_interview_coach

An interview practice app built on **Cloudflare** that meets the assignment criteria:
- **LLM**: Uses Workers AI with Meta **Llama 3.3 70B Instruct (fp8 fast)**.
- **Workflow / coordination**: A Cloudflare **Workflow** orchestrates asking a question → evaluating your answer → saving feedback.
- **User input via chat**: Minimal chat UI served by the Worker (can be hosted on Pages too).
- **Memory/state**: **Durable Object** stores per-session chat history and scores.

---

## Quick start (local dev)

1) **Install deps**  
```bash
npm i
npx wrangler login
```

2) **Dev**  
```bash
npm run dev
```

3) **Deploy**  
```bash
npm run deploy
```

The Worker serves a demo UI at `/` and a JSON chat API at `/api/chat`.

> Tip: Name your GitHub repo exactly like this directory (prefix **cf_ai_**) when you push: `cf_ai_interview_coach`.

---

## Architecture

```
Worker (src/index.ts)
 ├─ Serves chat UI (GET /)
 └─ API (POST /api/chat) → Durable Object (SessionMemory)
                               │
                               ├─ Calls Workers AI (@cf/meta/llama-3.3-70b-instruct-fp8-fast)
                               └─ Persists history & scores

Workflows (src/workflows/interview.ts)
 └─ Orchestrates: generate question → wait for answer → evaluate → store feedback
```

- **Workers AI** model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Durable Object**: maintains session history and simple scoring database
- **Workflow**: shows multi-step capability and delayed operations

---

## Running the components

### 1) Worker + Durable Object

```bash
npm run dev
# or
npm run deploy
```

The Durable Object migration runs automatically on first deploy (see `wrangler.toml`).

### 2) Trigger the Workflow

Use the REST endpoint `/api/start-workflow` to kick off an interview session. The Worker will start the workflow bound as `INTERVIEW` and stream progress back in JSON.

```bash
curl -X POST http://127.0.0.1:8787/api/start-workflow -H "Content-Type: application/json" -d '{"role":"backend"}'
```

---

## Files

- `src/index.ts` – Worker entry (routes, HTML UI, AI calls)
- `src/do/SessionMemory.ts` – Durable Object for session state
- `src/workflows/interview.ts` – Cloudflare Workflows example
- `PROMPTS.md` – AI prompts used (required by assignment)
- `wrangler.toml` – Config with AI binding, Durable Object, Workflow
- `package.json`, `tsconfig.json` – build/dev tooling

---

## Deploying to Pages (optional)

You can also deploy the static UI to **Pages** and use **Pages Functions** to proxy to the same Worker bindings. This repo keeps things in one Worker for simplicity, but the code is Pages-ready.

---

## Notes & Sources

- Workers AI model catalog and Llama **3.3 70B fp8 fast** identifier are documented by Cloudflare.  
- Cloudflare **Workflows** API used here mirrors the official examples for step orchestration.  
- Durable Objects power stateful chat rooms and history in Cloudflare tutorials.

See the citations in the pull request or assignment submission.
