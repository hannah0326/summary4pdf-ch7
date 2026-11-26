// 작성: 2026-11-26 11:50 KST
// QA용 PDF 생성기 (직접 만든 내용만 사용). 사용: node scripts/make-qa-pdfs.mjs <출력 폴더>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

const outDir = process.argv[2];
if (!outDir) {
  console.error("출력 폴더를 인자로 주세요.");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const save = (name, bytes) => writeFileSync(join(outDir, name), bytes);

// 영어 PDF: 줄 목록을 여러 쪽에 나눠 쓴다
async function englishPdf(lines, perPage = 40) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < lines.length; i += perPage) {
    const page = doc.addPage([612, 792]);
    lines.slice(i, i + perPage).forEach((t, j) => {
      page.drawText(t, { x: 40, y: 750 - j * 18, size: 10, font });
    });
  }
  return doc.save();
}

// 한국어 PDF: 글꼴 비포함 CID 글꼴 + ToUnicode (글자 추출 시험용, 화면 표시는 뷰어 글꼴에 의존)
function koreanPdf(lines) {
  const hex = (s) => [...s].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  const content =
    "BT /F1 12 Tf 40 760 Td 18 TL\n" + lines.map((l) => `<${hex(l)}> Tj T*`).join("\n") + "\nET";
  const cmap =
    "/CIDInit /ProcSet findresource begin 12 dict begin begincmap\n" +
    "/CMapName /Adobe-Identity-UCS def /CMapType 2 def\n" +
    "1 begincodespacerange <0000> <FFFF> endcodespacerange\n" +
    "1 beginbfrange <0000> <FFFF> <0000> endbfrange\nendcmap end end";
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type0 /BaseFont /MalgunGothic /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 8 0 R >>",
    "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /MalgunGothic /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 7 0 R /CIDToGIDMap /Identity >>",
    "<< /Type /FontDescriptor /FontName /MalgunGothic /Flags 4 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 900 /Descent -200 /CapHeight 700 /StemV 80 >>",
    `<< /Length ${cmap.length} >>\nstream\n${cmap}\nendstream`,
  ];
  let out = "%PDF-1.7\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (out += `${String(o).padStart(10, "0")} 00000 n \n`));
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const lecture = [
  "운영체제 3주차 강의 자료: 프로세스와 스레드",
  "프로세스는 실행 중인 프로그램이며 고유한 주소 공간과 자원을 가진다.",
  "스레드는 프로세스 안에서 실행 흐름을 나눈 단위로 코드와 힙 영역을 공유한다.",
  "문맥 교환은 CPU가 실행할 프로세스를 바꿀 때 레지스터 상태를 저장하고 복원하는 과정이다.",
  "스케줄링 정책에는 선입선출, 최단 작업 우선, 라운드 로빈, 우선순위 방식이 있다.",
  "라운드 로빈은 시간 할당량을 정해 돌아가며 실행하므로 응답 시간이 짧아진다.",
  "교착 상태는 여러 프로세스가 서로의 자원을 기다리며 영원히 멈추는 현상이다.",
  "교착 상태의 네 조건은 상호 배제, 점유 대기, 비선점, 순환 대기이다.",
  "세마포어는 공유 자원 접근을 제어하는 동기화 도구로 P 연산과 V 연산을 사용한다.",
  "뮤텍스는 한 번에 하나의 스레드만 임계 구역에 들어가도록 보장한다.",
];
save("ko-lecture.pdf", koreanPdf(lecture));

const paper = [
  "Attention Mechanisms for Low-Resource Text Classification",
  "Abstract. We study whether lightweight attention layers improve text classification when labeled data is scarce.",
  "We propose a small attention module that re-weights token embeddings before pooling.",
  "Experiments on three public benchmarks show an average accuracy gain of 2.4 percent over a pooling baseline.",
  "The gain is largest when fewer than five hundred labeled examples are available.",
  "Ablation studies indicate that the re-weighting step, not the extra parameters, explains most of the improvement.",
  "We also analyze failure cases, which concentrate on very short inputs with ambiguous vocabulary.",
  "Limitations. Our evaluation covers English only, and we did not test long documents.",
  "Conclusion. Simple attention re-weighting is a cheap and effective tool for low-resource classification.",
];
save("en-paper.pdf", await englishPdf(paper));

const formula = [
  "Physics and Geometry Notes",
  "Mass-energy equivalence: E = mc^2, where E is energy, m is mass and c is the speed of light.",
  "Pythagorean theorem: a^2 + b^2 = c^2 for a right triangle with legs a, b and hypotenuse c.",
  "Kinetic energy: K = (1/2) m v^2. Momentum: p = m v. Newton second law: F = m a.",
  "Quadratic formula: x = (-b +- sqrt(b^2 - 4ac)) / (2a).",
  "These relations are the basis for many introductory problems in mechanics and algebra.",
  "Example: a 2 kg object moving at 3 m/s has kinetic energy K = 0.5 * 2 * 9 = 9 J.",
];
save("formula.pdf", await englishPdf(formula));

// 12만 자 초과: 줄마다 번호가 달라 반복 압축을 피한다
const long = [];
for (let i = 1; i <= 1500; i++) {
  long.push(
    `Section ${i}: Observation number ${i} describes how river system ${i % 17} carries sediment toward the delta region ${i % 11}.`,
  );
}
save("long-130k.pdf", await englishPdf(long, 55));

const blank = await PDFDocument.create();
blank.addPage([600, 400]);
save("blank.pdf", await blank.save());

save("corrupt.pdf", Buffer.from("%PDF-1.7\nthis is not a real pdf body at all, just garbage ".repeat(5)));
save("fake-pdf-name.pdf", Buffer.from("그냥 텍스트 파일입니다. PDF가 아니에요.\n"));
save("plain.txt", Buffer.from("hello text file\n"));
const mb4 = Buffer.alloc(4 * 1024 * 1024, 0x20);
mb4.write("%PDF-1.7\n");
save("exact-4mb.pdf", mb4);
const mb4p = Buffer.alloc(4 * 1024 * 1024 + 1, 0x20);
mb4p.write("%PDF-1.7\n");
save("over-4mb.pdf", mb4p);
console.log("완료:", outDir);
