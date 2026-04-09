import { GoogleGenAI } from "@google/genai";
import { ai as replitAi } from "@workspace/integrations-gemini-ai";

const GEMMA_MODELS = ["gemma-4-31b-it", "gemma-3-27b-it"];
const FALLBACK_MODEL = "gemini-2.5-flash";

let _directAi: GoogleGenAI | null = null;
let _workingModel: string | null = null;

function getDirectClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_USER_API_KEY;
  if (!key) return null;
  if (!_directAi) {
    _directAi = new GoogleGenAI({ apiKey: key });
  }
  return _directAi;
}

export async function generateWithGemma(
  prompt: string,
  config: { maxOutputTokens?: number; responseMimeType?: string } = {}
): Promise<{ text: string; model: string }> {
  const client = getDirectClient();

  if (client) {
    const modelsToTry = _workingModel ? [_workingModel] : GEMMA_MODELS;

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            maxOutputTokens: config.maxOutputTokens ?? 1024,
            ...(config.responseMimeType
              ? { responseMimeType: config.responseMimeType }
              : {}),
          },
        });
        _workingModel = model;
        console.log(`[IAP-Gemma] Modelo: ${model}`);
        return { text: response.text ?? "{}", model };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[IAP-Gemma] ${model} falhou: ${msg.slice(0, 120)}`);
      }
    }
  }

  console.log(`[IAP-Gemma] Fallback → ${FALLBACK_MODEL} (Replit Integration)`);
  const response = await replitAi.models.generateContent({
    model: FALLBACK_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: config.maxOutputTokens ?? 1024,
      ...(config.responseMimeType
        ? { responseMimeType: config.responseMimeType }
        : {}),
    },
  });
  return { text: response.text ?? "{}", model: FALLBACK_MODEL };
}
