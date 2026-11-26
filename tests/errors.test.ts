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
  it("E2는 파일 크기를 소수 첫째 자리 올림 MB로 넣는다", () => {
    expect(errorMessage("E2", { sizeBytes: 5_400_000 })).toContain("5.2MB");
  });
  it("E2는 4MB+1바이트를 4.1MB로 보여 한도와 구별한다", () => {
    expect(errorMessage("E2", { sizeBytes: 4 * 1024 * 1024 + 1 })).toBe(
      "파일이 너무 커요(4.1MB). 4MB 이하의 PDF를 올려 주세요.",
    );
  });
  it("E5는 다음 행동을 안내한다", () => {
    expect(errorMessage("E5")).toBe(
      "비밀번호가 걸린 PDF는 요약할 수 없어요. 비밀번호를 푼 PDF로 다시 올려 주세요.",
    );
  });
  it("E2는 크기를 모르면 한도만 안내한다", () => {
    expect(errorMessage("E2")).toContain("4MB 이하");
  });
  it("E1 문구", () => {
    expect(errorMessage("E1")).toBe("PDF 파일만 올릴 수 있어요.");
  });
});
