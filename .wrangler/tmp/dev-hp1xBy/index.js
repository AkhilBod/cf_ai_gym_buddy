var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/do/SessionMemory.ts
var GYM_RESPONSES = {
  "form": [
    "Great question! For proper form, focus on: 1) Full range of motion, 2) Controlled movements, 3) Engaging the target muscle. Avoid momentum and jerky movements.",
    "Form tips: Keep your core tight, maintain neutral spine, and move deliberately. Quality over quantity every time! \u{1F4AA}"
  ],
  "motivation": [
    "You got this! Remember why you started. Every rep counts and you're getting stronger every day! \u{1F525}",
    "Let's go! You're crushing it! Push through those last reps\u2014that's where the gains happen!"
  ],
  "weight": [
    "Progressive overload is key! Increase weight by 5-10% when you can do all sets/reps with good form. Don't rush it.",
    "Focus on perfecting form first, then gradually increase weight. Slow and steady wins the gains race!"
  ],
  "rest": [
    "Rest is when muscles grow! Aim for 48 hours between training the same muscle groups. Sleep 7-9 hours for recovery.",
    "Recovery matters: 60-90 seconds between sets for strength, 30-45 seconds for hypertrophy. Don't skip rest days!"
  ],
  "nutrition": [
    "Fuel your gains! Eat 0.7-1g protein per pound of body weight daily. Don't forget carbs and healthy fats too.",
    "Post-workout nutrition is crucial. Get protein and carbs within 2 hours of training for optimal recovery."
  ]
};
function getMockAIResponse(exercise, userText) {
  const lowerText = userText.toLowerCase();
  for (const [keyword, responses] of Object.entries(GYM_RESPONSES)) {
    if (lowerText.includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  const defaults = [
    `Nice! Keep crushing your ${exercise} workout! Focus on form and consistency. \u{1F4AA}`,
    `That's awesome dedication to ${exercise}! You're building strength and discipline. Keep it up!`,
    `${exercise} is an excellent choice! Stay focused, controlled movements, and you'll see great results!`
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}
__name(getMockAIResponse, "getMockAIResponse");
var SessionMemory = class {
  static {
    __name(this, "SessionMemory");
  }
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/start") && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const exercise = body.role || "general workout";
      await this.state.storage.put("exercise", exercise);
      await this.state.storage.put("history", []);
      return Response.json({ message: `Let's crush ${exercise}! \u{1F4AA} Tell me about your workout or ask for tips.` });
    }
    if (url.pathname.endsWith("/chat") && req.method === "POST") {
      const { text, model } = await req.json();
      let history = await this.state.storage.get("history") || [];
      const exercise = await this.state.storage.get("exercise") || "general workout";
      history.push({ role: "user", content: text });
      let ai = "";
      try {
        const aiResp = await this.env.AI.run(model, {
          prompt: `You are an energetic and supportive gym buddy AI. You help with exercise form advice, motivation, workout tips, and progress tracking. Keep responses under 150 words and be friendly and encouraging. Current exercise: ${exercise}.

User: ${text}

Your response:`,
          max_tokens: 256,
          temperature: 0.5
        });
        ai = typeof aiResp === "string" ? aiResp : aiResp.response || JSON.stringify(aiResp);
      } catch (err) {
        console.error("AI Error:", err);
        ai = getMockAIResponse(exercise, text);
      }
      history.push({ role: "assistant", content: ai });
      await this.state.storage.put("history", history);
      return Response.json({ user: text, ai });
    }
    return new Response("Not found", { status: 404 });
  }
};

// src/workflows/interview.ts
import { WorkflowEntrypoint } from "cloudflare:workers";
var InterviewWorkflow = class extends WorkflowEntrypoint {
  static {
    __name(this, "InterviewWorkflow");
  }
  async run(event, step) {
    const role = event.params?.role || "software";
    await step.do("generate question", async () => {
      return `What's a recent project where you used ${role} skills?`;
    });
    await step.sleep("wait for answer", "10 seconds");
    const result = await step.do("evaluate", async () => {
      return { score: 4, pros: "Clear structure", cons: "Could be more specific" };
    });
    await step.do("persist", async () => result);
  }
};

// src/index.ts
var MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
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
      <h1>\u{1F4AA} AI Gym Buddy</h1>
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
        add('system', data.message || 'Workout started! \u{1F4AA}');
        exercise.value = '';
      };

      sendBtn.onclick = async () => {
        if (!msg.value.trim()) return;
        add('user', msg.value);
        const body = { sessionId, text: msg.value };
        const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.ai) add('ai', data.ai);
        msg.value='';
      };

      msg.onkeydown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          sendBtn.onclick();
        }
      };
    <\/script>
  </body>
</html>`;
}
__name(html, "html");
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response(html(), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/api/start" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId") ?? crypto.randomUUID();
      const role = url.searchParams.get("role") ?? "software";
      const id = env.SESSION.idFromName(sessionId);
      const stub = env.SESSION.get(id);
      const r = await stub.fetch("https://do/start", { method: "POST", body: JSON.stringify({ role }) });
      const json = await r.json();
      return Response.json({ ok: true, ...json });
    }
    if (url.pathname === "/api/chat" && req.method === "POST") {
      const body = await req.json();
      const sessionId = body.sessionId ?? crypto.randomUUID();
      const text = String(body.text || "").slice(0, 4e3);
      const id = env.SESSION.idFromName(sessionId);
      const stub = env.SESSION.get(id);
      const r = await stub.fetch("https://do/chat", { method: "POST", body: JSON.stringify({ text, model: MODEL }) });
      return new Response(await r.text(), { headers: { "content-type": "application/json" } });
    }
    if (url.pathname === "/api/start-workflow" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const role = body.role || "software";
      const run = await env.INTERVIEW.create({ params: { role } });
      return Response.json({ workflow: run.id, status: "started" });
    }
    return new Response("Not found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-5VLkQ6/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-5VLkQ6/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  InterviewWorkflow,
  SessionMemory,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
