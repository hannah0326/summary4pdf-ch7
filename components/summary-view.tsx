// 작성: 2026-11-26 13:45 KST
// 결과 화면: 한 줄 요약 -> 핵심 내용 -> 정의·용어·공식, 복사·다시 요약·새 PDF
"use client";

import { useEffect, useRef, useState } from "react";
import { buildCopyText, copyToClipboard, COPY_FAILED_MESSAGE, TRUNCATED_NOTICE } from "@/lib/client/copy-text";
import { LengthPicker } from "@/components/length-picker";
import { LENGTH_SPEC, type Summary, type SummaryLength } from "@/lib/types";

export const AI_NOTICE = "AI 요약이라 틀릴 수 있어요. 중요한 내용은 원문을 확인하세요.";

const BTN =
  "min-h-11 rounded-lg border border-zinc-500 px-4 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60 dark:hover:bg-zinc-800";

export function SummaryView({
  summary,
  fileName,
  busy,
  length,
  onLength,
  onResummarize,
  onReset,
}: {
  summary: Summary;
  fileName: string;
  busy: boolean;
  /** 다시 요약할 때 쓸 길이 */
  length: SummaryLength;
  onLength: (v: SummaryLength) => void;
  onResummarize: () => void;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const ok = await copyToClipboard(buildCopyText(summary));
    setCopied(ok ? "ok" : "fail");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), ok ? 2000 : 4000);
  }

  return (
    <article className="flex flex-col gap-6">
      <p className="text-sm text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-300">
        {fileName} · {LENGTH_SPEC[summary.length].label}
      </p>

      <section aria-labelledby="h-one">
        <h2 id="h-one" className="mb-2 text-lg font-semibold">한 줄 요약</h2>
        <p className="break-words rounded-lg bg-blue-50 p-4 text-blue-950 dark:bg-blue-950 dark:text-blue-50">
          {summary.oneLine}
        </p>
      </section>

      <section aria-labelledby="h-key">
        <h2 id="h-key" className="mb-2 text-lg font-semibold">핵심 내용</h2>
        <ol className="list-decimal space-y-3 pl-6">
          {summary.keyPoints.map((p, i) => (
            <li key={i} className="break-words">
              <strong className="font-semibold">{p.title}</strong>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">{p.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {summary.terms.length > 0 && (
        <section aria-labelledby="h-terms">
          <h2 id="h-terms" className="mb-2 text-lg font-semibold">정의·용어·공식</h2>
          <dl className="space-y-3">
            {summary.terms.map((t, i) => (
              <div key={i} className="break-words">
                <dt className={t.isFormula ? "font-mono font-semibold whitespace-pre-wrap" : "font-semibold"}>
                  {t.term}
                </dt>
                <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{t.explanation}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {summary.truncated && (
        <p className="rounded-lg border border-amber-700 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          {TRUNCATED_NOTICE}
        </p>
      )}

      <LengthPicker value={length} onChange={onLength} disabled={busy} />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={BTN}>전체 복사</button>
        <button type="button" onClick={onResummarize} disabled={busy} className={BTN}>
          길이 바꿔 다시 요약
        </button>
        <button type="button" onClick={onReset} disabled={busy} className={BTN}>새 PDF 요약</button>
        <span role="status" className={`flex min-h-11 items-center text-sm ${
            copied === "fail" ? "text-red-800 dark:text-red-300" : "text-green-800 dark:text-green-300"
          }`}
        >
          {copied === "ok" ? "복사했어요" : copied === "fail" ? COPY_FAILED_MESSAGE : ""}
        </span>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{AI_NOTICE}</p>
    </article>
  );
}
