// 작성: 2026-11-26 13:45 KST
// 업로드 화면: 끌어다 놓기 영역, 파일 고르기, 길이, 고지 문구, 요약하기
"use client";

import { useRef, useState } from "react";
import { LengthPicker } from "@/components/length-picker";
import type { SummaryLength } from "@/lib/types";

export const UPLOAD_NOTICE =
  "올린 PDF는 이 앱에 저장하지 않아요. 내용은 요약을 위해 외부 무료 AI로 전달되고, 그곳에서 기록·학습에 쓰일 수 있어요.";

export function UploadPanel({
  file,
  length,
  busy,
  onFile,
  onLength,
  onSubmit,
}: {
  file: File | null;
  length: SummaryLength;
  busy: boolean;
  onFile: (file: File) => void;
  onLength: (v: SummaryLength) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (f) onFile(f);
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) pick(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center sm:p-10 ${
          dragging ? "border-blue-700 bg-blue-50 dark:bg-blue-950" : "border-zinc-400 dark:border-zinc-600"
        }`}
      >
        <p className="break-words">
          {file ? (
            <>
              선택한 파일: <strong className="[overflow-wrap:anywhere]">{file.name}</strong>
            </>
          ) : (
            "PDF 파일을 여기로 끌어다 놓으세요"
          )}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-lg border border-zinc-500 px-4 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60 dark:hover:bg-zinc-800"
        >
          파일 고르기
        </button>
      </div>

      <LengthPicker value={length} onChange={onLength} disabled={busy} />

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{UPLOAD_NOTICE}</p>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 rounded-lg bg-blue-700 px-6 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-60"
      >
        요약하기
      </button>
    </form>
  );
}
