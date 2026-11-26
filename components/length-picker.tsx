// 작성: 2026-11-26 13:45 KST
// 요약 길이 고르기(라디오 3개)
import { LENGTH_SPEC, type SummaryLength } from "@/lib/types";

const ORDER: SummaryLength[] = ["short", "medium", "long"];

export function LengthPicker({
  value,
  onChange,
  disabled,
}: {
  value: SummaryLength;
  onChange: (v: SummaryLength) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-sm font-medium">요약 길이</legend>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((key) => (
          <label
            key={key}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-zinc-400 px-4 text-sm has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-900 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-zinc-600 dark:has-[:checked]:bg-blue-950 dark:has-[:checked]:text-blue-100"
          >
            <input
              type="radio"
              name="length"
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="size-4 accent-blue-700"
            />
            {LENGTH_SPEC[key].label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
