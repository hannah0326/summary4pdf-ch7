// 작성: 2026-11-26 13:42 KST
// 브라우저에서 쓰는 요약 API 호출과 업로드 전 검사
import { errorMessage } from "@/lib/errors";
import {
  MAX_FILE_BYTES,
  type ApiErrorBody,
  type ErrorCode,
  type Summary,
  type SummaryLength,
} from "@/lib/types";

export type SummarizeResult =
  | { ok: true; summary: Summary }
  | { ok: false; code: ErrorCode | "NETWORK"; message: string };

export const NETWORK_MESSAGE = "인터넷 연결을 확인하고 다시 시도해 주세요.";

const CODES: readonly string[] = ["E1", "E2", "E3", "E4", "E5", "E6", "E7"];

function parseError(data: unknown): { code: ErrorCode; message: string } | null {
  const e = (data as Partial<ApiErrorBody> | null)?.error;
  if (e && typeof e.code === "string" && CODES.includes(e.code) && typeof e.message === "string") {
    return { code: e.code, message: e.message };
  }
  return null;
}

export async function postSummarize(
  file: File,
  length: SummaryLength,
  fetchImpl: typeof fetch = fetch,
): Promise<SummarizeResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("length", length);

  let res: Response;
  try {
    res = await fetchImpl("/api/summarize", { method: "POST", body: form });
  } catch {
    return { ok: false, code: "NETWORK", message: NETWORK_MESSAGE };
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // JSON이 아닌 응답(게이트웨이 오류 등)은 아래에서 E7로 처리
  }

  if (res.ok && data && typeof (data as Summary).oneLine === "string") {
    return { ok: true, summary: data as Summary };
  }
  const err = parseError(data);
  if (err) return { ok: false, ...err };
  return { ok: false, code: "E7", message: errorMessage("E7") };
}

type PrecheckResult = { ok: true } | { ok: false; code: "E1" | "E2" | "E4"; message: string };

/** 크기와 파일 머리(%PDF-)를 서버에 보내기 전에 확인 */
export async function precheckFile(file: File): Promise<PrecheckResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, code: "E2", message: errorMessage("E2", { sizeBytes: file.size }) };
  }
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  } catch {
    // 선택 뒤 파일이 옮겨지거나 지워진 경우 등
    return { ok: false, code: "E4", message: errorMessage("E4") };
  }
  const isPdf = head.length === 5 && String.fromCharCode(...head) === "%PDF-";
  if (!isPdf) return { ok: false, code: "E1", message: errorMessage("E1") };
  return { ok: true };
}
