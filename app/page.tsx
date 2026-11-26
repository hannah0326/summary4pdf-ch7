// 작성: 2026-11-26 13:50 KST
// 한 페이지 화면: 업로드 -> 처리 중 -> 결과 / 오류
"use client";

import { useState } from "react";
import { ErrorBox } from "@/components/error-box";
import { ProgressNote } from "@/components/progress-note";
import { SummaryView } from "@/components/summary-view";
import { UploadPanel } from "@/components/upload-panel";
import { postSummarize, precheckFile } from "@/lib/client/api";
import { errorMessage } from "@/lib/errors";
import { DEFAULT_LENGTH, type Summary, type SummaryLength } from "@/lib/types";

// 오류 뒤 [다시 시도]가 하는 일: 같은 파일을 다시 보내거나, 고칠 수 없는 파일이면 처음으로
type Failure = { message: string; retry: "submit" | "reset" };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [length, setLength] = useState<SummaryLength>(DEFAULT_LENGTH);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  async function run(target: File | null) {
    if (busy) return;
    if (!target) {
      setFailure({ message: errorMessage("E6"), retry: "reset" });
      return;
    }
    setBusy(true);
    setFailure(null);
    const check = await precheckFile(target);
    if (!check.ok) {
      setFile(null);
      setSummary(null);
      setFailure({ message: check.message, retry: "reset" });
      setBusy(false);
      return;
    }
    const result = await postSummarize(target, length);
    if (result.ok) {
      setSummary(result.summary);
    } else {
      setSummary(null);
      setFailure({ message: result.message, retry: "submit" });
    }
    setBusy(false);
  }

  function reset() {
    setFile(null);
    setSummary(null);
    setFailure(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold">PDF 요약</h1>

      {summary && file ? (
        <SummaryView
          summary={summary}
          fileName={file.name}
          busy={busy}
          length={length}
          onLength={setLength}
          onResummarize={() => run(file)}
          onReset={reset}
        />
      ) : (
        <>
          {failure && (
            <ErrorBox
              message={failure.message}
              disabled={busy}
              onRetry={() => (failure.retry === "submit" ? run(file) : reset())}
            />
          )}
          <UploadPanel
            file={file}
            length={length}
            busy={busy}
            onFile={(f) => {
              setFile(f);
              setFailure(null);
            }}
            onLength={setLength}
            onSubmit={() => run(file)}
          />
        </>
      )}

      {busy && <ProgressNote />}
    </main>
  );
}
