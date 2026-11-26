// 작성: 2026-11-26 12:46 KST
// 모델 응답 해석: 너그럽게 JSON을 꺼내되, 핵심 요소가 없으면 형식 오류
import {
  LENGTH_SPEC,
  type KeyPoint,
  type Summary,
  type SummaryLength,
  type Term,
} from "@/lib/types";

function invalid(): never {
  throw new Error("invalid_format");
}

/** 코드 울타리·앞뒤 설명을 걷어내고 첫 JSON 객체를 꺼낸다. */
function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) invalid();
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return invalid();
  }
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export function parseSummary(
  raw: string,
  length: SummaryLength,
): Omit<Summary, "truncated" | "length" | "model"> {
  const data = extractJson(raw);
  if (typeof data !== "object" || data === null || Array.isArray(data)) invalid();
  const obj = data as Record<string, unknown>;

  if (!nonEmpty(obj.oneLine)) invalid();

  const keyPoints: KeyPoint[] = [];
  if (Array.isArray(obj.keyPoints)) {
    for (const item of obj.keyPoints) {
      const it = item as Record<string, unknown> | null;
      if (it && typeof it === "object" && nonEmpty(it.title) && nonEmpty(it.detail)) {
        keyPoints.push({ title: it.title.trim(), detail: it.detail.trim() });
      }
    }
  }
  if (keyPoints.length === 0) invalid();

  const terms: Term[] = [];
  if (Array.isArray(obj.terms)) {
    for (const item of obj.terms) {
      const it = item as Record<string, unknown> | null;
      if (it && typeof it === "object" && nonEmpty(it.term) && nonEmpty(it.explanation)) {
        terms.push({
          term: it.term.trim(),
          explanation: it.explanation.trim(),
          isFormula: it.isFormula === true,
        });
      }
    }
  }

  const spec = LENGTH_SPEC[length];
  return {
    oneLine: obj.oneLine.trim(),
    keyPoints: keyPoints.slice(0, spec.keyPoints),
    terms: terms.slice(0, spec.maxTerms),
  };
}
