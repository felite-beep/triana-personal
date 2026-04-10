import { NextRequest, NextResponse } from "next/server";

type AnalysisResult = {
  score: number;
  tone: string;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  rewrite: string;
};

type AnalysisResponse = {
  result: AnalysisResult;
  provider: "gemini";
  model?: string;
  message?: string;
};

const EMPATHY_PROMPT = "Kalau suatu saat aku lagi marah atau kita berantem lagi, kamu bakal merespons aku seperti apa supaya masalahnya nggak makin besar dan kita bisa baikan?";
const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MODEL_PREFERENCE = [
  PRIMARY_GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
];

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    tone: { type: "string" },
    issues: { type: "array", items: { type: "string" } },
    strengths: { type: "array", items: { type: "string" } },
    suggestions: { type: "array", items: { type: "string" } },
    rewrite: { type: "string" },
  },
  required: ["score", "tone", "issues", "strengths", "suggestions", "rewrite"],
} as const;

type GeminiModelInfo = {
  name?: string;
  supportedGenerationMethods?: string[];
};

let availableModelNamesCache: Promise<string[]> | null = null;

const normalizeModelName = (model: string) => model.replace(/^models\//, "").trim();

const getAvailableModelNames = async (apiKey: string) => {
  if (!availableModelNamesCache) {
    availableModelNamesCache = (async () => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const detail = errorText.trim().length > 0 ? `: ${errorText.slice(0, 240)}` : "";
        throw new Error(`Gemini model list gagal: ${response.status}${detail}`);
      }

      const data = (await response.json()) as {
        models?: GeminiModelInfo[];
      };

      return (data.models ?? [])
        .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((model) => normalizeModelName(model.name ?? ""))
        .filter((name) => name.length > 0);
    })().catch((error) => {
      availableModelNamesCache = null;
      throw error;
    });
  }

  return availableModelNamesCache;
};

const pickModelCandidates = async (apiKey: string) => {
  const availableModelNames = await getAvailableModelNames(apiKey);
  const selected = MODEL_PREFERENCE.filter((model, index, array) => model.trim().length > 0 && array.indexOf(model) === index)
    .map(normalizeModelName)
    .filter((model) => availableModelNames.includes(model));

  if (selected.length > 0) {
    return selected;
  }

  return availableModelNames;
};

const normalizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? items : fallback;
};

const normalizeTextValue = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const normalizeResult = (value: unknown): AnalysisResult => {
  if (!value || typeof value !== "object") {
    throw new Error("Gemini mengembalikan format yang tidak valid.");
  }

  const data = value as Record<string, unknown>;
  const score = Number(data.score);
  const tone = normalizeTextValue(data.tone, "");
  const rewrite = normalizeTextValue(data.rewrite, "");
  const issues = normalizeStringArray(data.issues, []);
  const strengths = normalizeStringArray(data.strengths, []);
  const suggestions = normalizeStringArray(data.suggestions, []);

  if (!Number.isFinite(score)) {
    throw new Error("Gemini tidak mengirim skor yang valid.");
  }

  if (!tone || !rewrite) {
    throw new Error("Gemini tidak mengirim tone atau rewrite yang valid.");
  }

  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    tone,
    issues: issues.slice(0, 3),
    strengths: strengths.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
    rewrite,
  };
};

const buildGeminiPrompt = (draft: string) => `
Kamu adalah penilai empati untuk jawaban singkat dalam bahasa Indonesia.
Skenario konflik yang harus dipakai adalah: "${EMPATHY_PROMPT}"

Nilai jawaban berikut dan keluarkan HANYA JSON valid dengan field score, tone, issues, strengths, suggestions, dan rewrite.

Aturan:
- score harus angka bulat 0 sampai 100.
- tone harus salah satu dari: "Empatik kuat", "Cukup empatik", "Perlu diperdalam", "Terlalu defensif".
- issues, strengths, suggestions masing-masing maksimal 3 poin.
- rewrite harus 2 sampai 3 kalimat, hangat, jelas, dan lebih empatik daripada jawaban asli, tetap dari sudut pandang "kamu" yang bicara ke "aku".
- Fokus pada validasi emosi lawan bicara, nada menenangkan saat konflik, tanggung jawab, dan ajakan baikan yang realistis.
- Jangan menyalin jawaban mentah secara penuh jika masih terdengar defensif; perbaiki bahasanya.
- Jangan sertakan markdown, code block, atau teks tambahan apa pun.
- Jika ada data yang tidak tersedia, gunakan array kosong atau string kosong, jangan tambahkan penjelasan.

Jawaban untuk dianalisis:
"""
${draft.trim()}
"""
`;

const tryParseJsonPayload = (text: string) => {
  const normalized = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  const startIndex = normalized.indexOf("{");
  const endIndex = normalized.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const payload = normalized.slice(startIndex, endIndex + 1);

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    const repaired = payload
      .replace(/([\{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)\s*:/g, '$1"$2":')
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/:\s*'([^']*)'/g, ': "$1"');

    try {
      return JSON.parse(repaired) as unknown;
    } catch {
      return null;
    }
  }
};

const parseGeminiJson = (text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const extracted = tryParseJsonPayload(text);
    if (extracted) {
      return extracted;
    }

    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 220);
    throw new Error(`Gemini tidak mengirim JSON yang bisa diparse. Cuplikan: ${snippet || "(kosong)"}`);
  }
};

const buildRepairPrompt = (rawOutput: string) => `
Ubah output berikut menjadi JSON VALID SAJA tanpa markdown, tanpa code block.

Skema:
{
  "score": number,
  "tone": string,
  "issues": string[],
  "strengths": string[],
  "suggestions": string[],
  "rewrite": string
}

Aturan:
- score wajib 0-100.
- tone wajib salah satu: "Empatik kuat", "Cukup empatik", "Perlu diperdalam", "Terlalu defensif".
- issues/strengths/suggestions boleh kosong, tapi tetap harus array.
- rewrite wajib string tidak kosong.
- Keluarkan hanya JSON object.

OUTPUT MENTAH:
"""
${rawOutput}
"""
`;

const requestGeminiRawText = async (model: string, apiKey: string, prompt: string, useSchema = true) => {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.25,
    topP: 0.95,
    maxOutputTokens: 4048,
    responseMimeType: "application/json",
  };

  if (useSchema) {
    generationConfig.responseSchema = RESPONSE_SCHEMA;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const detail = errorText.trim().length > 0 ? `: ${errorText.slice(0, 240)}` : "";
    throw new Error(`Gemini request gagal: ${response.status}${detail}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
      finishReason?: string;
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason ?? "";
    throw new Error(`Gemini tidak mengembalikan teks hasil analisis${finishReason ? ` (finishReason: ${finishReason})` : ""}.`);
  }

  return text;
};

const runGeminiWithModel = async (draft: string, model: string, apiKey: string): Promise<AnalysisResult> => {
  const text = await requestGeminiRawText(model, apiKey, buildGeminiPrompt(draft));

  try {
    return normalizeResult(parseGeminiJson(text));
  } catch {
    const repairedText = await requestGeminiRawText(model, apiKey, buildRepairPrompt(text), false);
    return normalizeResult(parseGeminiJson(repairedText));
  }
};

const runGemini = async (draft: string): Promise<{ result: AnalysisResult; model: string }> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) throw new Error("GEMINI_API_KEY belum tersedia.");

  const modelCandidates = await pickModelCandidates(apiKey);

  let lastError: unknown = null;

  for (const model of modelCandidates) {
    try {
      const result = await runGeminiWithModel(draft, model, apiKey);
      return { result, model };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "Gemini gagal memproses jawaban.";

      if (!/\b404\b|\b429\b|\b503\b|UNAVAILABLE|high demand|not found|unsupported/i.test(message)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini gagal memproses jawaban.");
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { draft?: unknown } | null;
    const draft = typeof body?.draft === "string" ? body.draft.trim() : "";

    if (draft.length === 0) {
      return NextResponse.json(
        {
          error: "Teks masih kosong.",
        },
        { status: 400 }
      );
    }

    const { result, model } = await runGemini(draft);

    return NextResponse.json<AnalysisResponse>(
      {
        result,
        provider: "gemini",
        model,
        message: `Ini kesimpulannya.`,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini gagal memproses jawaban.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}