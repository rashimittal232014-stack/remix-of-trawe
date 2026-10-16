// Multi-provider JSON completion helper.
// Routes to the tenant's active AI provider (ChatGPT / Gemini / Claude) when
// a matching API key is saved; otherwise falls back to Google Gemini via a
// GEMINI_API_KEY project secret, and finally to the Lovable AI Gateway.

type Msg = { role: "system" | "user" | "assistant"; content: string };

type ProviderCfg = {
  active?: "chatgpt" | "gemini" | "claude";
  providers?: {
    chatgpt?: { api_key?: string; model?: string };
    gemini?: { api_key?: string; model?: string };
    claude?: { api_key?: string; model?: string };
  };
};

async function callOpenAI(messages: Msg[], apiKey: string, model: string): Promise<any | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const txt = j?.choices?.[0]?.message?.content ?? "";
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

async function callGemini(messages: Msg[], apiKey: string, model: string): Promise<any | null> {
  try {
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-flash-latest"}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}),
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const txt = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

async function callClaude(messages: Msg[], apiKey: string, model: string): Promise<any | null> {
  try {
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-haiku-latest",
        max_tokens: 4096,
        system: sys ? `${sys}\n\nRespond ONLY with a single valid JSON object.` : "Respond ONLY with a single valid JSON object.",
        messages: rest,
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const txt = j?.content?.map((c: any) => c?.text ?? "").join("") ?? "";
    if (!txt) return null;
    // Claude may wrap in markdown code fences.
    const cleaned = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function geminiJson(
  messages: Msg[],
  opts?: {
    model?: string;
    gatewayModel?: string;
    tenantKey?: string | null;
    providerCfg?: ProviderCfg | null;
  },
): Promise<any | null> {
  // Priority:
  //   1) Tenant's active provider (if key saved) — ChatGPT | Gemini | Claude
  //   2) Legacy tenantKey Gemini path (for backwards compatibility)
  //   3) Project-wide GEMINI_API_KEY secret
  //   4) Lovable AI Gateway (paid)
  const cfg = opts?.providerCfg;
  const active = cfg?.active;
  const providers = cfg?.providers ?? {};

  if (active && providers[active]?.api_key?.trim()) {
    const p = providers[active]!;
    const key = p.api_key!.trim();
    const model = p.model || undefined;
    let out: any = null;
    if (active === "chatgpt") out = await callOpenAI(messages, key, model || "gpt-4o-mini");
    else if (active === "gemini") out = await callGemini(messages, key, model || "gemini-flash-latest");
    else if (active === "claude") out = await callClaude(messages, key, model || "claude-3-5-haiku-latest");
    if (out) return out;
    // fall through to shared AI on error
  }

  // Legacy per-tenant Gemini key or project secret
  const userKey = (opts?.tenantKey && opts.tenantKey.trim()) || process.env.GEMINI_API_KEY;
  if (userKey) {
    const out = await callGemini(messages, userKey, opts?.model ?? "gemini-flash-latest");
    if (out) return out;
  }

  // Fallback: Lovable AI Gateway
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: opts?.gatewayModel ?? "google/gemini-3.6-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    const j: any = await res.json();
    const txt = j?.choices?.[0]?.message?.content ?? "";
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Free-form chat completion (returns plain text, not JSON). Used by the
// conversational AI Itinerary Builder. Routes through the same provider
// priority as geminiJson().
// ---------------------------------------------------------------------------
async function chatOpenAI(messages: Msg[], apiKey: string, model: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model || "gpt-4o-mini", messages }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    return j?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function chatGemini(messages: Msg[], apiKey: string, model: string): Promise<string | null> {
  try {
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-flash-latest"}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}),
        generationConfig: { temperature: 0.7 },
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: any) => p?.text ?? "").join("") || null;
  } catch { return null; }
}

async function chatClaude(messages: Msg[], apiKey: string, model: string): Promise<string | null> {
  try {
    const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-haiku-latest",
        max_tokens: 2048,
        ...(sys ? { system: sys } : {}),
        messages: rest,
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    return j?.content?.map((c: any) => c?.text ?? "").join("") ?? null;
  } catch { return null; }
}

export async function geminiChat(
  messages: Msg[],
  opts?: {
    model?: string;
    gatewayModel?: string;
    tenantKey?: string | null;
    providerCfg?: ProviderCfg | null;
  },
): Promise<string | null> {
  const cfg = opts?.providerCfg;
  const active = cfg?.active;
  const providers = cfg?.providers ?? {};
  if (active && providers[active]?.api_key?.trim()) {
    const p = providers[active]!;
    const key = p.api_key!.trim();
    const model = p.model || undefined;
    let out: string | null = null;
    if (active === "chatgpt") out = await chatOpenAI(messages, key, model || "gpt-4o-mini");
    else if (active === "gemini") out = await chatGemini(messages, key, model || "gemini-flash-latest");
    else if (active === "claude") out = await chatClaude(messages, key, model || "claude-3-5-haiku-latest");
    if (out) return out;
  }
  const userKey = (opts?.tenantKey && opts.tenantKey.trim()) || process.env.GEMINI_API_KEY;
  if (userKey) {
    const out = await chatGemini(messages, userKey, opts?.model ?? "gemini-flash-latest");
    if (out) return out;
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: opts?.gatewayModel ?? "google/gemini-3.6-flash",
        messages,
      }),
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    return j?.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}