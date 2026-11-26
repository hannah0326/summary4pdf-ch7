// 작성: 2026-11-26 12:47 KST
// OpenRouter 호출: 1순위 -> 실패 시 2순위 한 번. 둘 다 실패하면 E7.
// 서버에서만 쓴다(API 키는 환경 변수 OPENROUTER_API_KEY).
import { AppError } from "@/lib/errors";
import type { Summary, SummaryLength } from "@/lib/types";
import { MODELS, PER_MODEL_TIMEOUT_MS, TOTAL_DEADLINE_MS } from "./config";
import { parseSummary } from "./parse";
import { buildMessages } from "./prompt";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
/** 남은 시간이 이보다 적으면 다음 모델을 부르지 않는다. */
const MIN_REMAINING_MS = 3_000;

export interface SummarizeDeps {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  now?: () => number;
}

/** 로그에는 모델·성공 여부·HTTP 상태·걸린 시간만 남긴다(문서 내용·키 금지). */
function logCall(model: string, ok: boolean, status: number | null, ms: number): void {
  console.log(JSON.stringify({ tag: "summarize", model, ok, status, ms }));
}

export async function summarize(
  text: string,
  length: SummaryLength,
  deps: SummarizeDeps = {},
): Promise<Summary> {
  const apiKey = deps.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AppError("E7");
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;

  const messages = buildMessages(text, length);
  const start = now();

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    const remaining = TOTAL_DEADLINE_MS - (now() - start);
    if (i > 0 && remaining < MIN_REMAINING_MS) break;
    const timeoutMs = Math.min(PER_MODEL_TIMEOUT_MS, remaining);

    const callStart = now();
    let status: number | null = null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: 4000,
        reasoning: { effort: "low" },
      };
      // JSON 형식 강제는 2순위에만 쓴다(1순위는 지원이 불확실).
      if (i > 0) body.response_format = { type: "json_object" };

      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      status = res.status;
      if (!res.ok) throw new Error(`http_${res.status}`);

      const json = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("invalid_format");

      const parsed = parseSummary(content, length);
      logCall(model, true, status, now() - callStart);
      return { ...parsed, truncated: false, length, model };
    } catch {
      // 시간 초과·네트워크 오류·형식 오류 모두 다음 모델로 넘어간다.
      logCall(model, false, status, now() - callStart);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AppError("E7");
}
