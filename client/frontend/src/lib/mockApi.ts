import data from "@/data/data.json";

export type EmailResult = (typeof data.emails)[number] & {
  modelId?: string;
  modelName?: string;
  latencyMs?: number;
};

export type ModelId = (typeof data.models)[number]["id"];

export async function checkEmail(emailText: string, modelId: ModelId = "distilbert"): Promise<EmailResult> {
  const model = data.models.find((m) => m.id === modelId) ?? data.models[2];
  const baseDelay = parseInt(model.latency) || 50;
  // Bigger models "take longer" but cap so UX stays snappy
  const delay = Math.min(300 + baseDelay * 6, 1800);
  const start = performance.now();
  await new Promise((r) => setTimeout(r, delay));

  const t = emailText.toLowerCase();
  const phishingHints = ["urgent", "verify", "suspend", "click here", "gift card", "bit.ly", "winner", "congratulations"];
  const score = phishingHints.reduce((acc, h) => acc + (t.includes(h) ? 1 : 0), 0);
  const base = score >= 2 ? data.emails[0] : score === 1 ? data.emails[2] : data.emails[1];

  // More accurate models = higher confidence (clamped 0–0.99)
  const confidence = Math.min(0.99, base.confidence * (0.85 + model.accuracy * 0.18));

  return {
    ...base,
    confidence,
    modelId: model.id,
    modelName: model.name,
    latencyMs: Math.round(performance.now() - start),
  };
}

export const mock = data;
