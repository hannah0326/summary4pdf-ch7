// 작성: 2026-11-26 12:41 KST
// 업로드 파일 검사: 파일 이름·MIME은 믿지 않고 내용(머리)만 본다
import { AppError, errorMessage } from "@/lib/errors";
import { MAX_FILE_BYTES } from "@/lib/types";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/** E6(없음/0바이트) → E2(크기 초과) → E1(PDF 아님) 순으로 검사하고 바이트를 돌려준다 */
export async function validateUpload(file: File | null): Promise<Uint8Array> {
  if (!file || file.size === 0) throw new AppError("E6");
  if (file.size > MAX_FILE_BYTES) {
    throw new AppError("E2", errorMessage("E2", { sizeBytes: file.size }));
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!PDF_MAGIC.every((b, i) => bytes[i] === b)) throw new AppError("E1");
  return bytes;
}
