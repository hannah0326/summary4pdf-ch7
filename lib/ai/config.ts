// 작성: 2026-11-26 12:45 KST
// AI 요약 설정: 모델 순서, 시간 예산, 입력 한도, 긴 문서 자르기

/** 1순위 -> 실패 시 2순위 한 번. 모델을 바꿀 때는 여기만 고친다. */
export const MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-super-vl:free",
] as const;

/** 모델 한 번 호출의 제한 시간(ms) */
export const PER_MODEL_TIMEOUT_MS = 25_000;
/** 요약 전체 시간 예산(ms) */
export const TOTAL_DEADLINE_MS = 52_000;
/** 모델에 보내는 문서 글자 수 상한 */
export const MAX_INPUT_CHARS = 120_000;

/**
 * 한도를 넘으면 앞 maxChars자만 남긴다.
 * 자른 부분의 앞쪽 절반 이후에 문단 경계(빈 줄)가 있으면 거기서 끊는다.
 */
export function truncateText(
  text: string,
  maxChars: number = MAX_INPUT_CHARS,
): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const cut = text.slice(0, maxChars);
  const boundary = cut.lastIndexOf("\n\n");
  const result = boundary > maxChars / 2 ? cut.slice(0, boundary) : cut;
  return { text: result.trimEnd(), truncated: true };
}
