// 작성: 2026-11-26 13:08 KST
// POST /api/summarize: PDF 검사 -> 글자 추출 -> 길이 제한 -> AI 요약
import { AppError, errorMessage, errorStatus } from "@/lib/errors";
import { MAX_INPUT_TOKENS_EST, truncateText } from "@/lib/ai/config";
import { summarize } from "@/lib/ai/summarize";
import { extractText } from "@/lib/pdf/extract";
import { validateUpload } from "@/lib/pdf/validate";
import {
  DEFAULT_LENGTH,
  LENGTH_SPEC,
  type ApiErrorBody,
  type ErrorCode,
  type SummaryLength,
} from "@/lib/types";

// runtime 설정은 cacheComponents와 충돌해 빼 둠(기본값이 Node.js)
export const maxDuration = 60;

function errorResponse(code: ErrorCode, message?: string): Response {
  const body: ApiErrorBody = { error: { code, message: message ?? errorMessage(code) } };
  return Response.json(body, { status: errorStatus(code) });
}

function parseLength(value: FormDataEntryValue | null): SummaryLength {
  return typeof value === "string" && Object.hasOwn(LENGTH_SPEC, value)
    ? (value as SummaryLength)
    : DEFAULT_LENGTH;
}

export async function POST(request: Request): Promise<Response> {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AppError("E6");
    }
    const entry = form.get("file");
    const file = entry instanceof File ? entry : null;
    const length = parseLength(form.get("length"));

    const bytes = await validateUpload(file);
    const { text } = await extractText(bytes);
    const { text: input, truncated } = truncateText(text, MAX_INPUT_TOKENS_EST);
    const summary = await summarize(input, length);
    return Response.json({ ...summary, truncated, length });
  } catch (e) {
    if (e instanceof AppError) return errorResponse(e.code, e.message);
    // 문서 내용·키가 섞일 수 있으니 오류 종류(이름)만 남긴다
    const kind = e instanceof Error ? e.name : typeof e;
    console.error(JSON.stringify({ tag: "summarize-route", error: kind }));
    return errorResponse("E7");
  }
}
