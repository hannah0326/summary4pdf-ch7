// 작성: 2026-11-26 13:42 KST
// 요약 결과를 클립보드용 글로 바꾼다
import type { Summary } from "@/lib/types";

export const TRUNCATED_NOTICE = "문서가 길어 앞부분만 요약했어요";

export function buildCopyText(s: Summary): string {
  const parts = [
    `한 줄 요약\n${s.oneLine}`,
    `핵심 내용\n${s.keyPoints.map((p, i) => `${i + 1}. ${p.title} — ${p.detail}`).join("\n")}`,
  ];
  if (s.terms.length > 0) {
    parts.push(`정의·용어·공식\n${s.terms.map((t) => `- ${t.term} — ${t.explanation}`).join("\n")}`);
  }
  if (s.truncated) parts.push(`(${TRUNCATED_NOTICE})`);
  return parts.join("\n\n");
}
