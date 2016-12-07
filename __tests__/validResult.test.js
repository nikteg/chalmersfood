import { validResult, success, fail } from "../food";

describe("validResult", () => {
  const resultWithError = fail("Test", "Some error");
  const resultWithoutError = success("Test", ["Item 1", "Item 2"]);
  const result2WithoutError = success("Test 2", ["Different item 1", "Different item 2"]);

  const resultWithoutErrorNewerDate = success("Test", ["Item 1", "Item 2"]);
  resultWithoutErrorNewerDate.date += 3600; // 1 hour in the futurue

  it("returns new result on old result error", () => {
    expect(validResult(resultWithError, resultWithoutError)).toBe(resultWithoutError);
  });

  it("returns new result on new items", () => {
    expect(validResult(resultWithoutError, result2WithoutError)).toBe(result2WithoutError);
  });

  it("returns old result on new result error", () => {
    expect(validResult(resultWithoutError, resultWithError)).toBe(resultWithoutError);
  });

  it("returns old result on new result error", () => {
    expect(validResult(resultWithoutError, resultWithError)).toBe(resultWithoutError);
  });

  it("returns old result on same items, but newer date", () => {
    expect(validResult(resultWithoutError, resultWithoutErrorNewerDate).date)
      .toBeLessThanOrEqual(resultWithoutError.date);
  });
});
