const factorialChain = require("./3-factorial-chain");

describe("factorialChain", () => {
  it("should return the correct last digits of the sum of factorials", () => {
    expect(factorialChain(5, 3)).toBe("153");
    expect(factorialChain(5, 1)).toBe("3");
    expect(factorialChain(5, 5)).toBe("00153");
  });

  it("should handle cases with fewer digits than lastDigits", () => {
    expect(factorialChain(3, 5)).toBe("00009");
    expect(factorialChain(4, 2)).toBe("33");
  });

  it("should handle cases with leading zeros", () => {
    expect(factorialChain(5, 7)).toBe("0000153");
    expect(factorialChain(6, 4)).toBe("0873");
  });
});
