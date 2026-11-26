// 작성: 2026-11-26 12:40 KST
// 시험용 PDF를 메모리에서 만든다 (글꼴·파일 없이 pdf-lib 사용)
import { PDFDocument, StandardFonts } from "pdf-lib";

const SENTENCE = "Photosynthesis converts light energy into chemical energy.";

/** 글자가 든 PDF 1장 (공백 제외 50자 이상) */
export async function makeRealPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 400]);
  page.drawText(SENTENCE, { x: 20, y: 300, size: 12, font });
  return doc.save();
}

/** 빈 쪽 1장짜리 PDF */
export async function makeBlankPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([600, 400]);
  return doc.save();
}

/** `%PDF-` 머리를 달고 정확히 size 바이트인 자료 (크기 검사 시험용) */
export function pdfBytesOfSize(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set(new TextEncoder().encode("%PDF-1.7\n"));
  return bytes;
}
