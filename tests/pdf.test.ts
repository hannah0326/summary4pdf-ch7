// 작성: 2026-11-26 12:40 KST
import { beforeAll, describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { validateUpload } from "@/lib/pdf/validate";
import { extractText, toExtractError } from "@/lib/pdf/extract";
import {
  makeBlankPdf,
  makeRealPdf,
  pdfBytesOfSize,
} from "./fixtures/make-fixtures";

const text = (s: string) => new TextEncoder().encode(s);
const file = (bytes: Uint8Array, name = "a.pdf", type = "application/pdf") =>
  new File([bytes as BlobPart], name, { type });

let realPdf: Uint8Array;
let blankPdf: Uint8Array;
beforeAll(async () => {
  realPdf = await makeRealPdf();
  blankPdf = await makeBlankPdf();
});

describe("validateUpload", () => {
  it("파일이 없으면 E6", async () => {
    await expect(validateUpload(null)).rejects.toMatchObject({ code: "E6" });
  });
  it("0바이트면 E6", async () => {
    await expect(validateUpload(file(new Uint8Array(0)))).rejects.toMatchObject({ code: "E6" });
  });
  it("4MB는 통과", async () => {
    await expect(validateUpload(file(pdfBytesOfSize(4 * 1024 * 1024)))).resolves.toBeInstanceOf(Uint8Array);
  });
  it("4MB+1바이트는 E2", async () => {
    await expect(validateUpload(file(pdfBytesOfSize(4 * 1024 * 1024 + 1)))).rejects.toMatchObject({ code: "E2" });
  });
  it("머리가 %PDF-가 아니면 이름이 .pdf여도 E1", async () => {
    await expect(validateUpload(file(text("hello"), "fake.pdf"))).rejects.toMatchObject({ code: "E1" });
  });
  it("확장자·MIME이 없어도 머리가 %PDF-면 통과", async () => {
    await expect(validateUpload(file(realPdf, "noext", ""))).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe("extractText", () => {
  it("글자가 든 PDF에서 글자와 쪽수를 뽑는다", async () => {
    const r = await extractText(realPdf);
    expect(r.text).toContain("Photosynthesis");
    expect(r.pages).toBe(1);
  });
  it("글자가 없으면 E3", async () => {
    await expect(extractText(blankPdf)).rejects.toMatchObject({ code: "E3" });
  });
  it("깨진 PDF는 E4", async () => {
    await expect(extractText(text("%PDF-1.7\n깨진 내용"))).rejects.toMatchObject({ code: "E4" });
  });
});

describe("toExtractError", () => {
  it("PasswordException은 E5", () => {
    const e = Object.assign(new Error("No password given"), { name: "PasswordException", code: 1 });
    expect(toExtractError(e)).toMatchObject({ code: "E5" });
  });
  it("그 밖의 오류는 E4", () => {
    expect(toExtractError(new Error("boom"))).toMatchObject({ code: "E4" });
    expect(toExtractError("문자열")).toMatchObject({ code: "E4" });
  });
  it("AppError는 그대로 돌려준다", () => {
    const e = new AppError("E3");
    expect(toExtractError(e)).toBe(e);
  });
});
