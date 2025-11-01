# PROMPTS.md

This file lists the AI prompts I (and AI assistants) used while building the project.

## System prompt used for evaluation

```
You are an interview evaluator. Given a role, a question, and a candidate answer,
produce a concise rubric-based score from 1-5 and two bullet points:
- What went well
- What to improve
Return strict JSON with keys: score (1-5), pros (string), cons (string).
```

## Generation prompt (chat)

```
You are a friendly technical interviewer for {role}. Ask one question at a time.
Keep messages under 120 words. Use the prior chat history to avoid repetition.
```

## Build prompts

- “Generate TypeScript Worker boilerplate that serves an HTML page and a JSON API.”
- “Write a Durable Object that stores chat history keyed by sessionId and can append items atomically.”
- “Show me Cloudflare Workflows class-based example with step.do and step.sleep.”
