const findMajorityElement = require("./5-find-majority-element");

describe("findMajorityElement", () => {
  it("should return the majority element if it exists", () => {
    expect(findMajorityElement([1, 2, 3, 1, 1])).toBe(1);
    expect(findMajorityElement([1, 2, 2, 2, 3])).toBe(2);
  });

  it("should return null if no majority element exists", () => {
    expect(findMajorityElement([1, 2, 3, 4])).toBe(null);
    expect(findMajorityElement([1, 2, 3, 4, 5])).toBe(null);
  });

  it("should handle arrays of length 0", () => {
    expect(findMajorityElement([])).toBe(null);
  });

  it("should handle arrays with one element", () => {
    expect(findMajorityElement([1])).toBe(1);
    expect(findMajorityElement([2])).toBe(2);
  });

  it("should handle large arrays efficiently", () => {
    const largeArray = Array(1000000).fill(1);
    expect(findMajorityElement(largeArray)).toBe(1);
  });
});
