const rotateArray = require("./2-array-rotation");

describe("rotateArray", () => {
  it("should rotate the array correctly", () => {
    expect(rotateArray([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5, 1, 2]);
    expect(rotateArray([1, 2, 3, 4, 5], 7)).toEqual([3, 4, 5, 1, 2]);
    expect(rotateArray([1, 2, 3, 4, 5], 0)).toEqual([1, 2, 3, 4, 5]);
    expect(rotateArray([1], 1)).toEqual([1]);
    expect(rotateArray([], 2)).toEqual([]);
  });

  it("should handle greater n values than array length", () => {
    expect(rotateArray([1, 2, 3], 6)).toEqual([1, 2, 3]);
    expect(rotateArray([1, 2, 3], 5)).toEqual([3, 1, 2]);
  });
});
