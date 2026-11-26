// 작성: 2026-11-26 13:45 KST
// 오류 문구와 [다시 시도] 단추
export function ErrorBox({
  message,
  onRetry,
  disabled,
}: {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-700 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
    >
      <p className="break-words">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="mt-3 min-h-11 rounded-lg bg-red-800 px-4 text-sm font-medium text-white hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:opacity-60"
      >
        다시 시도
      </button>
    </div>
  );
}
