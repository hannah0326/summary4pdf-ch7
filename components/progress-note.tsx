// 작성: 2026-11-26 13:45 KST
// 처리 중 표시: 지난 시간(초)만 보여 준다
"use client";

import { useEffect, useState } from "react";

export function ProgressNote() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p role="status" className="flex items-center gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-blue-700 motion-reduce:animate-none"
      />
      요약하는 중이에요 ({seconds}초)
    </p>
  );
}
