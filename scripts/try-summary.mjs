// 작성: 2026-11-26 12:55 KST
// 실제 OpenRouter 호출 시험(딱 2회: 한국어 글 1회, 영어 글 1회). 무료 모델 하루 한도가 있어 늘리지 않는다.
// 실행: node --env-file-if-exists=.env scripts/try-summary.mjs
// 키·요청 헤더는 출력하지 않고, 결과는 모델·걸린 시간·요약 앞부분만 보여 준다.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";

const root = process.cwd();

// TS 소스를 그대로 불러오기 위한 최소 해석 규칙: "@/" 별칭과 확장자 없는 상대 경로
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const file = resolvePath(root, specifier.slice(2) + ".ts");
      return { url: pathToFileURL(file).href, shortCircuit: true };
    }
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier) && context.parentURL) {
      const url = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { summarize } = await import("../lib/ai/summarize.ts");

if (!process.env.OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY가 설정되어 있지 않아요.");
  process.exit(1);
}

const samples = [
  {
    label: "한국어",
    text: "광합성은 식물이 빛 에너지를 이용해 이산화탄소와 물로 포도당과 산소를 만드는 과정이다. 엽록체의 엽록소가 빛을 흡수하면 명반응에서 ATP와 NADPH가 만들어지고, 이것이 칼빈 회로에서 이산화탄소를 포도당으로 바꾸는 데 쓰인다. 전체 반응식은 6CO2 + 6H2O -> C6H12O6 + 6O2로 쓴다. 광합성의 속도는 빛의 세기, 이산화탄소 농도, 온도의 영향을 받는다.",
  },
  {
    label: "영어",
    text: "Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll in the chloroplasts absorbs sunlight, driving the light-dependent reactions that produce ATP and NADPH. These molecules power the Calvin cycle, which fixes carbon dioxide into glucose. The overall equation is 6CO2 + 6H2O -> C6H12O6 + 6O2. The rate of photosynthesis depends on light intensity, carbon dioxide concentration, and temperature.",
  },
];

const hasHangul = (s) => /[가-힣]/.test(s);

for (const { label, text } of samples) {
  const t0 = Date.now();
  try {
    const s = await summarize(text, "medium");
    console.log(
      JSON.stringify({
        label,
        ok: true,
        model: s.model,
        ms: Date.now() - t0,
        oneLineKorean: hasHangul(s.oneLine),
        keyPoints: s.keyPoints.length,
        terms: s.terms.length,
        oneLine: s.oneLine.slice(0, 80),
      }),
    );
  } catch (e) {
    console.log(JSON.stringify({ label, ok: false, code: e?.code ?? "unknown", ms: Date.now() - t0 }));
  }
}
