import { GymBuddyAgent } from "./do/SessionMemory";
import { InterviewWorkflow } from "./workflows/interview";

export interface Env {
  AI: Ai;
  AGENT: DurableObjectNamespace<GymBuddyAgent>;
  INTERVIEW: Workflow<InterviewWorkflow>;
}

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function html() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Gym Buddy</title>
    <style>
      html, body { background: #0b0b0b; color: #fff; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      .wrap { max-width: 800px; margin: 40px auto; padding: 16px; }
      .card { background:#111; border:1px solid #1f1f1f; border-radius:16px; padding:16px; }
      .row { display:flex; gap:8px; margin-top:12px; }
      input, button, textarea { background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:12px; padding:12px; width:100%; }
      button { width:auto; cursor:pointer; transition: 0.2s; }
      button:hover { background:#1a1a1a; }
      .msg.user { color:#e2e2e2; }
      .msg.ai { color:#9cd67b; }
      .msg.system { color:#ff9f43; }
      .bubble { padding:10px 12px; border-radius:12px; background:#0e0e0e; border:1px solid #242424; }
      .stack { display:flex; flex-direction:column; gap:8px; }
      h1 { margin:0 0 16px 0; font-size:28px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>💪 AI Gym Buddy</h1>
      <div class="card">
        <div id="log" class="stack"></div>
        <div class="row">
          <input id="exercise" placeholder="Exercise (e.g., bench press, squats, running)"/>
          <button id="start">Start Workout</button>
        </div>
        <div class="row">
          <textarea id="msg" placeholder="Describe your workout, ask for form tips, or ask for motivation..." style="resize:vertical; min-height:60px;"></textarea>
          <button id="send">Send</button>
        </div>
        <small>Your gym session is saved. Model: Llama 3.3 70B Instruct FP8 Fast.</small>
      </div>
    </div>
    <script type="module">
      const log = document.getElementById('log');
      const exercise = document.getElementById('exercise');
      const msg = document.getElementById('msg');
      const startBtn = document.getElementById('start');
      const sendBtn = document.getElementById('send');

      const sessionId = localStorage.getItem('sess') || crypto.randomUUID();
      localStorage.setItem('sess', sessionId);

      function add(kind, text) {
        const div = document.createElement('div');
        div.className = 'bubble msg ' + kind;
        div.textContent = text;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
      }

      startBtn.onclick = async () => {
        const ex = exercise.value || 'general workout';
        const res = await fetch('/api/start?sessionId=' + sessionId + '&role=' + encodeURIComponent(ex), { method: 'POST' });
        const data = await res.json();
        add('system', data.message || 'Workout started! 💪');
        exercise.value = '';
      };

      sendBtn.onclick = async () => {
        if (!msg.value.trim()) return;
        add('user', msg.value);
        add('system', '⏳ Coach is thinking...');
        const body = { sessionId, text: msg.value };
        const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await res.json();
        // Remove the loading message
        const messages = log.querySelectorAll('.bubble');
        if (messages.length > 0 && messages[messages.length - 1].textContent === '⏳ Coach is thinking...') {
          messages[messages.length - 1].remove();
        }
        if (data.ai) add('ai', data.ai);
        msg.value='';
      };

      msg.onkeydown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          sendBtn.onclick();
        }
      };
    </script>
  </body>
</html>`;
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(html(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/api/start" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId") ?? crypto.randomUUID();
      const role = url.searchParams.get("role") ?? "software";
      const id = env.AGENT.idFromName(sessionId);
      const stub = env.AGENT.get(id);
      const r = await stub.fetch("https://do/start", { method: "POST", body: JSON.stringify({ role }) });
      const json = await r.json<any>();
      return Response.json({ ok: true, ...json });
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      const body = await req.json<any>();
      const sessionId = body.sessionId ?? crypto.randomUUID();
      const text = String(body.text || "").slice(0, 4000);
      const id = env.AGENT.idFromName(sessionId);
      const stub = env.AGENT.get(id);
      const r = await stub.fetch("https://do/chat", { method: "POST", body: JSON.stringify({ text, model: MODEL }) });
      return new Response(await r.text(), { headers: { "content-type": "application/json" } });
    }

    if (url.pathname === "/api/start-workflow" && req.method === "POST") {
      const body = await req.json<any>().catch(() => ({}));
      const role = body.role || "software";
      const run = await env.INTERVIEW.create({ params: { role } });
      return Response.json({ workflow: run.id, status: "started" });
    }

    return new Response("Not found", { status: 404 });
  },
};

declare global {
  interface Ai {
    run(model: string, input: any): Promise<any>;
  }
  interface Workflow<T = unknown> {
    create(init?: any): Promise<{ id: string }>;
  }
}

export { GymBuddyAgent } from "./do/SessionMemory";
export { InterviewWorkflow } from "./workflows/interview";
