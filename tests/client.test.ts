// 작성: 2026-11-26 13:40 KST
// 화면용 보조 함수(postSummarize, precheckFile, buildCopyText) 시험
import { describe, expect, it } from "vitest";
import { buildCopyText, copyToClipboard } from "@/lib/client/copy-text";
import { postSummarize, precheckFile } from "@/lib/client/api";
import { errorMessage } from "@/lib/errors";
import { MAX_FILE_BYTES, type Summary } from "@/lib/types";

const sample: Summary = {
  oneLine: "한 줄 요약",
  keyPoints: [
    { title: "제목1", detail: "설명1" },
    { title: "제목2", detail: "설명2" },
  ],
  terms: [{ term: "용어", explanation: "설명", isFormula: false }],
  truncated: false,
  length: "medium",
  model: "m",
};

const pdfFile = (name = "a.pdf") =>
  new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], name, { type: "application/pdf" });

describe("postSummarize", () => {
  it("200이면 요약을 돌려준다", async () => {
    const f = (async () => Response.json(sample)) as typeof fetch;
    expect(await postSummarize(pdfFile(), "medium", f)).toEqual({ ok: true, summary: sample });
  });

  it("file과 length를 multipart로 보낸다", async () => {
    let body: FormData | undefined;
    const f = (async (_u: unknown, init?: RequestInit) => {
      body = init?.body as FormData;
      return Response.json(sample);
    }) as typeof fetch;
    await postSummarize(pdfFile("x.pdf"), "long", f);
    expect(body?.get("length")).toBe("long");
    expect((body?.get("file") as File).name).toBe("x.pdf");
  });

  it("오류 본문의 코드와 문구를 그대로 돌려준다", async () => {
    const f = (async () =>
      Response.json({ error: { code: "E2", message: "너무 커요" } }, { status: 413 })) as typeof fetch;
    expect(await postSummarize(pdfFile(), "medium", f)).toEqual({
      ok: false,
      code: "E2",
      message: "너무 커요",
    });
  });

  it("JSON이 아닌 오류 응답은 E7로 처리한다", async () => {
    const f = (async () => new Response("<html>gateway</html>", { status: 504 })) as typeof fetch;
    expect(await postSummarize(pdfFile(), "medium", f)).toEqual({
      ok: false,
      code: "E7",
      message: errorMessage("E7"),
    });
  });

  it("네트워크 오류는 NETWORK로 처리한다", async () => {
    const f = (async () => {
      throw new TypeError("failed");
    }) as typeof fetch;
    expect(await postSummarize(pdfFile(), "medium", f)).toEqual({
      ok: false,
      code: "NETWORK",
      message: "인터넷 연결을 확인하고 다시 시도해 주세요.",
    });
  });
});

describe("precheckFile", () => {
  const sized = (size: number, head = "%PDF-") => {
    const bytes = new Uint8Array(size);
    bytes.set(new TextEncoder().encode(head).slice(0, size));
    return new File([bytes], "a.pdf");
  };

  it("정확히 4MB인 PDF는 통과", async () => {
    expect(await precheckFile(sized(MAX_FILE_BYTES))).toEqual({ ok: true });
  });
  it("4MB+1바이트는 E2", async () => {
    const r = await precheckFile(sized(MAX_FILE_BYTES + 1));
    expect(r).toMatchObject({ ok: false, code: "E2" });
  });
  it("머리가 %PDF-가 아니면 E1", async () => {
    const r = await precheckFile(sized(100, "hello"));
    expect(r).toEqual({ ok: false, code: "E1", message: errorMessage("E1") });
  });
});

describe("precheckFile 읽기 실패", () => {
  it("파일을 읽지 못하면 거절하지 않고 E4 결과를 돌려준다", async () => {
    const broken = {
      size: 100,
      slice: () => ({ arrayBuffer: () => Promise.reject(new Error("읽기 실패")) }),
    } as unknown as File;
    expect(await precheckFile(broken)).toEqual({ ok: false, code: "E4", message: errorMessage("E4") });
  });
});

describe("copyToClipboard", () => {
  it("성공하면 true", async () => {
    let written = "";
    expect(await copyToClipboard("글", { writeText: async (t: string) => void (written = t) })).toBe(true);
    expect(written).toBe("글");
  });
  it("쓰기가 거절되면 false", async () => {
    expect(await copyToClipboard("글", { writeText: () => Promise.reject(new Error("denied")) })).toBe(false);
  });
  it("clipboard가 없으면 false", async () => {
    expect(await copyToClipboard("글", undefined)).toBe(false);
  });
});

describe("buildCopyText", () => {
  it("정해진 형식으로 만든다", () => {
    expect(buildCopyText(sample)).toBe(
      "한 줄 요약\n한 줄 요약\n\n핵심 내용\n1. 제목1 — 설명1\n2. 제목2 — 설명2\n\n정의·용어·공식\n- 용어 — 설명",
    );
  });
  it("truncated면 끝에 안내 줄을 넣는다", () => {
    expect(buildCopyText({ ...sample, truncated: true }).endsWith("\n\n(문서가 길어 앞부분만 요약했어요)")).toBe(true);
  });
  it("terms가 비면 용어 부분을 뺀다", () => {
    expect(buildCopyText({ ...sample, terms: [] })).not.toContain("정의·용어·공식");
  });
});
