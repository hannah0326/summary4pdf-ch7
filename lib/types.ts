// 작성: 2026-11-26 11:30 KST
// 앱 전체에서 공용으로 쓰는 타입과 상수

/** 요약 길이 선택지 */
export type SummaryLength = "short" | "medium" | "long";

/** 길이별 핵심 포인트 개수, 용어 최대 개수, 화면 라벨 */
export const LENGTH_SPEC: Record<
  SummaryLength,
  { keyPoints: number; maxTerms: number; label: string }
> = {
  short: { keyPoints: 3, maxTerms: 3, label: "짧게" },
  medium: { keyPoints: 4, maxTerms: 5, label: "보통" },
  long: { keyPoints: 5, maxTerms: 8, label: "자세히" },
};

export const DEFAULT_LENGTH: SummaryLength = "medium";

/** 올릴 수 있는 PDF 최대 크기(4MB) */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export interface KeyPoint {
  title: string;
  detail: string;
}

export interface Term {
  term: string;
  explanation: string;
  /** 수식·공식이면 true (원문 표기를 그대로 둠) */
  isFormula: boolean;
}

export interface Summary {
  oneLine: string;
  keyPoints: KeyPoint[];
  terms: Term[];
  /** 문서가 너무 길어 앞부분만 요약했는지 */
  truncated: boolean;
  length: SummaryLength;
  /** 실제로 요약한 모델 ID */
  model: string;
}

export type ErrorCode = "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7";

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}
