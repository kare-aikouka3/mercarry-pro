import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ResearchItem {
  name: string;
  reason: string;
  background: string;
  source: string;
  price: string | null;
  price_gap: string | null;
  kind_word: string;
  mercari_url: string;
}

interface ResearchCategory {
  id: "natural" | "luxury" | "gaming" | "arbitrage";
  title: string;
  items: ResearchItem[];
}

interface ResearchData {
  categories: ResearchCategory[];
  lastUpdated?: string;
}

const categoryTitles: Record<ResearchCategory["id"], string> = {
  natural: "自然素材 (Natural Materials)",
  luxury: "高級品リサーチ (Luxury Strategy)",
  gaming: "娯楽・ゲーム (Gaming Premium)",
  arbitrage: "価格差・高騰品 (Arbitrage)",
};

function readTextFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
}

function readItems(): ResearchData {
  const filePath = path.join(process.cwd(), "src", "data", "items.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(jsonData);
}

function collectExistingNames(data: ResearchData) {
  return data.categories.flatMap((category) => category.items.map((item) => item.name));
}

function extractOutputText(response: unknown): string {
  if (
    typeof response === "object" &&
    response !== null &&
    "output_text" in response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text;
  }

  if (typeof response === "object" && response !== null && "candidates" in response) {
    const candidates = response.candidates;
    if (!Array.isArray(candidates)) return "";

    return candidates
      .flatMap((candidate) => {
        if (typeof candidate !== "object" || candidate === null || !("content" in candidate)) {
          return [];
        }

        const content = candidate.content;
        if (typeof content !== "object" || content === null || !("parts" in content)) {
          return [];
        }

        const parts = content.parts;
        if (!Array.isArray(parts)) return [];

        return parts.flatMap((part) => {
          if (typeof part !== "object" || part === null || !("text" in part)) {
            return [];
          }

          return typeof part.text === "string" ? [part.text] : [];
        });
      })
      .join("\n");
  }

  if (typeof response !== "object" || response === null || !("output" in response)) {
    return "";
  }

  const output = response.output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((message) => {
      if (typeof message !== "object" || message === null || !("content" in message)) {
        return [];
      }

      const content = message.content;
      if (!Array.isArray(content)) return [];

      return content.flatMap((part) => {
        if (typeof part !== "object" || part === null || !("text" in part)) {
          return [];
        }

        return typeof part.text === "string" ? [part.text] : [];
      });
    })
    .join("\n");
}

function parseResearchData(outputText: string): ResearchData {
  const cleaned = outputText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const raw = JSON.parse(cleaned) as unknown;
  const parsed = normalizeResearchData(raw);

  if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) {
    throw new Error("AI response did not include categories.");
  }

  parsed.categories = parsed.categories
    .filter((category) => category.id in categoryTitles)
    .map((category) => ({
      ...category,
      title: categoryTitles[category.id],
      items: category.items.map((item) => ({
        ...item,
        price: item.price ?? null,
        price_gap: item.price_gap ?? null,
        mercari_url:
          item.mercari_url || `https://jp.mercari.com/search?keyword=${encodeURIComponent(item.name)}`,
      })),
    }));

  return parsed;
}

function normalizeResearchData(raw: unknown): ResearchData {
  if (Array.isArray(raw)) {
    return { categories: raw as ResearchCategory[] };
  }

  if (typeof raw !== "object" || raw === null) {
    return { categories: [] };
  }

  if ("categories" in raw && Array.isArray(raw.categories)) {
    return raw as ResearchData;
  }

  if (
    "result" in raw &&
    typeof raw.result === "object" &&
    raw.result !== null &&
    "categories" in raw.result &&
    Array.isArray(raw.result.categories)
  ) {
    return raw.result as ResearchData;
  }

  const categories = Object.entries(categoryTitles)
    .map(([id, title]) => {
      const value = (raw as Record<string, unknown>)[id];
      if (!Array.isArray(value)) return null;

      return {
        id,
        title,
        items: value,
      };
    })
    .filter((category): category is ResearchCategory => category !== null);

  return { categories };
}

function buildResearchPrompt(existingData: ResearchData) {
  const logic = readTextFile("mercari_research_logic.txt");
  const source = readTextFile("source.txt");
  const existingNames = collectExistingNames(existingData).join("、");
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `
今日は ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} です。
更新シード: ${seed}

あなたはメルカリ向けの商材リサーチ担当です。日本、特に北海道で現地仕入れできる可能性を重視し、更新のたびに新しい候補が出るようにしてください。

既存リサーチ方針:
${logic}

参考にする仕入れ先:
${source}

今回避ける既存候補:
${existingNames}

必須条件:
- 既存候補と同じ商品名、同じ型番、同じ有名定番の言い換えは避ける。
- 各カテゴリ6〜8件ずつ返す。
- カテゴリIDとタイトルは次の4つだけを使う: natural, luxury, gaming, arbitrage。
- メルカリ検索URLは商品名から jp.mercari.com/search?keyword=... の形式で作る。
- price または price_gap のどちらかには必ず値を入れる。使わない方は null。
- 医薬品、偽ブランド、危険物、法規制が強いもの、出品禁止の可能性が高いものは避ける。
- 断定しすぎず、需要理由には「なぜ買い手が探すのか」を短く具体的に書く。
- background には「なぜ今/最近狙うのか」を書く。検索で確認できた情報が弱い場合は仮説として書く。
- source には北海道で探すならどこを見るかを具体的に書く。
- 出力はスキーマに合うJSONだけ。説明文やMarkdownは不要。
`;
}

async function callGemini(
  apiKey: string,
  model: string,
  text: string,
  options?: {
    useSearch?: boolean;
    jsonMode?: boolean;
  }
) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
      ...(options?.useSearch ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: {
        temperature: options?.jsonMode ? 0.6 : 0.9,
        topP: 0.95,
        maxOutputTokens: options?.jsonMode ? 9000 : 5000,
        ...(options?.jsonMode
          ? {
              responseMimeType: "application/json",
            }
          : {}),
      },
    }),
  });

  const responseJson = await response.json();

  if (!response.ok) {
    const errorMessage =
      typeof responseJson?.error?.message === "string"
        ? responseJson.error.message
        : "Gemini research request failed.";
    throw new Error(errorMessage);
  }

  const outputText = extractOutputText(responseJson);
  if (!outputText) {
    throw new Error(`Gemini response did not include output text. ${summarizeGeminiResponse(responseJson)}`);
  }

  return outputText;
}

function summarizeGeminiResponse(response: unknown) {
  if (typeof response !== "object" || response === null) {
    return "";
  }

  const parts: string[] = [];

  if ("promptFeedback" in response) {
    parts.push(`promptFeedback=${JSON.stringify(response.promptFeedback)}`);
  }

  if ("candidates" in response && Array.isArray(response.candidates)) {
    const finishReasons = response.candidates
      .map((candidate) => {
        if (typeof candidate !== "object" || candidate === null || !("finishReason" in candidate)) {
          return "unknown";
        }

        return String(candidate.finishReason);
      })
      .join(",");

    parts.push(`finishReasons=${finishReasons || "none"}`);
  }

  return parts.join(" ");
}

async function generateResearchData(existingData: ResearchData): Promise<ResearchData> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const prompt = buildResearchPrompt(existingData);
  const researchNotes = await callGemini(
    apiKey,
    model,
    [
      "あなたは実用的な日本語のメルカリ商材リサーチ担当です。",
      "Google検索を使って、最近性・需要・北海道での現地仕入れ可能性を確認し、候補メモを作ってください。",
      "確認できない販売件数や売り切れ件数は断定せず、仮説として扱ってください。",
      "この段階ではJSONでなくて構いません。次の整形処理に渡すため、カテゴリ別に簡潔な候補メモを出してください。",
      prompt,
    ].join("\n\n"),
    { useSearch: true }
  );

  const outputText = await callGemini(
    apiKey,
    model,
    [
      "あなたは実用的な日本語のメルカリ商材リサーチ結果を、指定スキーマに合う厳密なJSONだけで返します。",
      "説明文、Markdown、コードフェンスは不要です。",
      "トップレベルは必ず { \"categories\": [...] } の形にしてください。",
      "各カテゴリは id, title, items を持ち、各商品は name, reason, background, source, price, price_gap, kind_word, mercari_url を持ちます。",
      "price と price_gap は、使わない方を null にしてください。",
      prompt,
      "検索付き下調べメモ:",
      researchNotes,
    ].join("\n\n"),
    { jsonMode: true }
  );

  return parseResearchData(outputText);
}

export async function GET() {
  try {
    const data = readItems();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading items.json:", error);
    return NextResponse.json({ error: "Failed to load research data" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const existingData = readItems();
    const data = await generateResearchData(existingData);

    return NextResponse.json({
      ...data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to refresh data";
    console.error("Gemini research failed:", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
