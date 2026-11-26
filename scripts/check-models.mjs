// 작성: 2026-11-26 11:30 KST
// OpenRouter 공개 모델 목록(키 불필요)에 요약용 모델 두 개가 있는지 확인한다.
const MODEL_IDS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-super-vl:free",
];

const res = await fetch("https://openrouter.ai/api/v1/models");
if (!res.ok) {
  console.error(`모델 목록을 가져오지 못했어요. HTTP ${res.status}`);
  process.exit(1);
}
const { data } = await res.json();
const ids = new Set(data.map((m) => m.id));

let missing = 0;
for (const id of MODEL_IDS) {
  const found = ids.has(id);
  if (!found) missing += 1;
  console.log(`${id}: ${found ? "있음" : "없음"}`);
}
process.exitCode = missing === 0 ? 0 : 1;
