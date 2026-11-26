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
/** 모델에 보내는 문서의 추정 토큰 상한(영어 약 12만 자 = 약 3만) */
export const MAX_INPUT_TOKENS_EST = 30_000;

/** 한글·한자·가나(CJK) 글자인지 확인한다. */
function isCjk(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x11ff) || // 한글 자모
    (code >= 0x3040 && code <= 0x30ff) || // 히라가나·가타카나
    (code >= 0x3130 && code <= 0x318f) || // 한글 호환 자모
    (code >= 0x3400 && code <= 0x4dbf) || // 한자 확장 A
    (code >= 0x4e00 && code <= 0x9fff) || // 한자
    (code >= 0xac00 && code <= 0xd7af) // 한글 음절
  );
}

/** 토큰 수 추정: CJK 1자 = 1, 그 밖의 글자 1자 = 0.25 */
export function estimateTokens(text: string): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += isCjk(text.charCodeAt(i)) ? 1 : 0.25;
  }
  return total;
}

/**
 * 추정 토큰이 한도를 넘으면 한도까지의 앞부분만 남긴다.
 * 자른 부분의 앞쪽 절반 이후에 문단 경계(빈 줄)가 있으면 거기서 끊는다.
 */
export function truncateText(
  text: string,
  maxTokens: number = MAX_INPUT_TOKENS_EST,
): { text: string; truncated: boolean } {
  let total = 0;
  let cutAt = -1;
  for (let i = 0; i < text.length; i++) {
    total += isCjk(text.charCodeAt(i)) ? 1 : 0.25;
    if (total > maxTokens) {
      cutAt = i;
      break;
    }
  }
  if (cutAt < 0) return { text, truncated: false };
  const cut = text.slice(0, cutAt);
  const boundary = cut.lastIndexOf("\n\n");
  const result = boundary > cut.length / 2 ? cut.slice(0, boundary) : cut;
  return { text: result.trimEnd(), truncated: true };
}
