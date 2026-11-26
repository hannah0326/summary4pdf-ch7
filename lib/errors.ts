// 작성: 2026-11-26 11:30 KST
// 오류 코드별 HTTP 상태와 안내 문구 (설계 5.4절)
import { MAX_FILE_BYTES, type ErrorCode } from "@/lib/types";

const STATUS: Record<ErrorCode, number> = {
  E1: 415,
  E2: 413,
  E3: 422,
  E4: 422,
  E5: 422,
  E6: 400,
  E7: 502,
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? errorMessage(code));
    this.name = "AppError";
    this.code = code;
  }
}

export function errorStatus(code: ErrorCode): number {
  return STATUS[code];
}

export function errorMessage(
  code: ErrorCode,
  detail?: { sizeBytes?: number },
): string {
  const limitMb = MAX_FILE_BYTES / 1024 / 1024;
  switch (code) {
    case "E1":
      return "PDF 파일만 올릴 수 있어요.";
    case "E2": {
      const size =
        detail?.sizeBytes !== undefined
          ? `(${(detail.sizeBytes / 1024 / 1024).toFixed(1)}MB)`
          : "";
      return `파일이 너무 커요${size}. ${limitMb}MB 이하의 PDF를 올려 주세요.`;
    }
    case "E3":
      return "이 PDF에서는 글자를 읽을 수 없어요. 스캔한 문서는 아직 지원하지 않아요.";
    case "E4":
      return "파일을 열 수 없어요. 다른 PDF로 다시 시도해 주세요.";
    case "E5":
      return "비밀번호가 걸린 PDF는 요약할 수 없어요.";
    case "E6":
      return "먼저 PDF를 골라 주세요.";
    case "E7":
      return "지금은 요약을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }
}
