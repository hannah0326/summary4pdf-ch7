// 작성: 2026-11-26 13:05 KST
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { MAX_INPUT_TOKENS_EST } from "@/lib/ai/config";
import { MAX_FILE_BYTES, type Summary, type SummaryLength } from "@/lib/types";
import { pdfBytesOfSize } from "./fixtures/make-fixtures";

vi.mock("@/lib/pdf/extract", () => ({ extractText: vi.fn() }));
vi.mock("@/lib/ai/summarize", () => ({ summarize: vi.fn() }));

import { extractText } from "@/lib/pdf/extract";
import { summarize } from "@/lib/ai/summarize";
import { POST } from "@/app/api/summarize/route";

const extractMock = vi.mocked(extractText);
const summarizeMock = vi.mocked(summarize);

const pdfFile = () =>
  new File([pdfBytesOfSize(2000) as BlobPart], "a.pdf", { type: "application/pdf" });

function req(file: File | null, length?: string): Request {
  const form = new FormData();
  if (file) form.set("file", file);
  if (length !== undefined) form.set("length", length);
  return new Request("http://localhost/api/summarize", { method: "POST", body: form });
}

const fakeSummary = (length: SummaryLength): Summary => ({
  oneLine: "한 줄",
  keyPoints: [],
  terms: [],
  truncated: false,
  length,
  model: "fake/model",
});

beforeEach(() => {
  extractMock.mockReset();
  summarizeMock.mockReset();
  extractMock.mockResolvedValue({ text: "hello world", pages: 1 });
  summarizeMock.mockImplementation(async (_t, length) => fakeSummary(length));
});

describe("POST /api/summarize", () => {
  it("파일이 없으면 400 E6", async () => {
    const res = await POST(req(null));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("E6");
  });

  it("텍스트 파일이면 415 E1", async () => {
    const f = new File(["hello"], "a.txt", { type: "text/plain" });
    const res = await POST(req(f));
    expect(res.status).toBe(415);
    expect((await res.json()).error.code).toBe("E1");
  });

  it("4MB+1바이트면 413 E2", async () => {
    const f = new File([pdfBytesOfSize(MAX_FILE_BYTES + 1) as BlobPart], "big.pdf");
    const res = await POST(req(f));
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("E2");
  });

  it("length가 없으면 medium, truncated는 false", async () => {
    const res = await POST(req(pdfFile()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe("medium");
    expect(body.truncated).toBe(false);
    expect(summarizeMock.mock.calls[0][1]).toBe("medium");
  });

  it("잘못된 length는 medium으로 처리", async () => {
    await POST(req(pdfFile(), "huge"));
    expect(summarizeMock.mock.calls[0][1]).toBe("medium");
  });

  it("유효한 length는 그대로 전달", async () => {
    const res = await POST(req(pdfFile(), "long"));
    expect((await res.json()).length).toBe("long");
  });

  it("한도를 넘는 글자는 잘라서 넘기고 truncated true", async () => {
    extractMock.mockResolvedValue({ text: "가".repeat(MAX_INPUT_TOKENS_EST + 500), pages: 9 });
    const res = await POST(req(pdfFile()));
    expect(res.status).toBe(200);
    expect((await res.json()).truncated).toBe(true);
    expect(summarizeMock.mock.calls[0][0].length).toBeLessThanOrEqual(MAX_INPUT_TOKENS_EST);
  });

  it("extractText의 AppError는 해당 상태로 전달", async () => {
    extractMock.mockRejectedValue(new AppError("E3"));
    const res = await POST(req(pdfFile()));
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("E3");
  });

  it("summarize가 E7을 던지면 502 E7", async () => {
    summarizeMock.mockRejectedValue(new AppError("E7"));
    const res = await POST(req(pdfFile()));
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("E7");
  });

  it("예상 밖 오류는 502 E7이고 본문에 원문·스택이 없다", async () => {
    const secret = "내부-비밀-오류-원문";
    summarizeMock.mockRejectedValue(new Error(secret));
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req(pdfFile()));
    const raw = await res.text();
    expect(res.status).toBe(502);
    expect(JSON.parse(raw).error.code).toBe("E7");
    expect(raw).not.toContain(secret);
    expect(raw).not.toContain("at ");
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(secret);
    logSpy.mockRestore();
  });
});
