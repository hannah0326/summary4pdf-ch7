// 작성: 2026-11-26 11:30 KST
import { describe, expect, it } from "vitest";
import { errorMessage, errorStatus } from "@/lib/errors";

describe("errorStatus", () => {
  it("오류 코드별 HTTP 상태를 돌려준다", () => {
    expect(errorStatus("E1")).toBe(415);
    expect(errorStatus("E2")).toBe(413);
    expect(errorStatus("E3")).toBe(422);
    expect(errorStatus("E4")).toBe(422);
    expect(errorStatus("E5")).toBe(422);
    expect(errorStatus("E6")).toBe(400);
    expect(errorStatus("E7")).toBe(502);
  });
});

describe("errorMessage", () => {
  it("E2는 파일 크기를 MB로 넣는다", () => {
    expect(errorMessage("E2", { sizeBytes: 5_400_000 })).toContain("5.1MB");
  });
  it("E2는 크기를 모르면 한도만 안내한다", () => {
    expect(errorMessage("E2")).toContain("4MB 이하");
  });
  it("E1 문구", () => {
    expect(errorMessage("E1")).toBe("PDF 파일만 올릴 수 있어요.");
  });
});
