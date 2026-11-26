// 작성: 2026-11-26 12:41 KST
// unpdf로 PDF 글자 추출. 오류는 AppError(E3/E4/E5)로 바꾼다
import { extractText as unpdfExtractText, getDocumentProxy } from "unpdf";
import { AppError } from "@/lib/errors";

/** 공백을 뺀 글자 수가 이보다 적으면 스캔본으로 보고 E3 */
export const MIN_TEXT_CHARS = 50;

/** pdf.js 오류를 앱 오류로 변환: 비밀번호 → E5, 그 밖 → E4 */
export function toExtractError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  if (
    typeof e === "object" &&
    e !== null &&
    (e as { name?: unknown }).name === "PasswordException"
  ) {
    return new AppError("E5");
  }
  return new AppError("E4");
}

export async function extractText(
  bytes: Uint8Array,
): Promise<{ text: string; pages: number }> {
  let text: string;
  let pages: number;
  try {
    // pdf.js가 버퍼를 가져가므로 복사본을 넘긴다
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await unpdfExtractText(pdf, { mergePages: true });
    text = result.text;
    pages = result.totalPages;
  } catch (e) {
    throw toExtractError(e);
  }
  if (text.replace(/\s/g, "").length < MIN_TEXT_CHARS) throw new AppError("E3");
  return { text, pages };
}
