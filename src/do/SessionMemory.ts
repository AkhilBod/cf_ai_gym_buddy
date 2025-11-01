import type { Env } from "../index";

export class GymBuddyAgent {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    
    if (url.pathname.endsWith("/start") && req.method === "POST") {
      const body = await req.json<any>().catch(() => ({}));
      const exercise = body.role || "general workout";
      await this.state.storage.put("exercise", exercise);
      await this.state.storage.put("history", [] as any[]);
      return Response.json({ message: `Let's crush ${exercise}! 💪 Tell me about your workout or ask for tips.` });
    }

    if (url.pathname.endsWith("/chat") && req.method === "POST") {
      const { text, model } = await req.json<any>();
      let history: any[] = (await this.state.storage.get<any[]>("history")) || [];
      const exercise = (await this.state.storage.get<string>("exercise")) || "general workout";

      history.push({ role: "user", content: text });
      
      const prompt = `You are an expert personal trainer and fitness coach. Keep responses SHORT and concise (max 100 words). Be direct and actionable.

Current Exercise: ${exercise}

Previous conversation:
${history.slice(-6).map((m) => `${m.role === "user" ? "Client" : "Coach"}: ${m.content}`).join("\n")}

Respond briefly with specific advice:`;

      try {
        const response = await this.env.AI.run(model, {
          prompt,
          max_tokens: 150,
          temperature: 0.7,
        });

        const ai = typeof response === "string" ? response : response.response || JSON.stringify(response);
        history.push({ role: "assistant", content: ai });
        await this.state.storage.put("history", history);

        return Response.json({ user: text, ai });
      } catch (err) {
        console.error("AI Error:", err);
        return Response.json({ user: text, ai: "Error calling AI. Please try again." }, { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}
