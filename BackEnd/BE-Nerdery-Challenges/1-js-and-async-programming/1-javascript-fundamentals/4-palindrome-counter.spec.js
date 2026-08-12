const palindromeCounter = require("./4-palindrome-counter.js");

describe("palindromeCounter", () => {
  it("should count palindromes correctly", () => {
    expect(palindromeCounter("level radar mom", 3)).toBe(3);
    expect(palindromeCounter("hello world", 3)).toBe(0);
    expect(palindromeCounter("Madam level Civic noon", 5)).toBe(3);
  });

  it("should ignore case when checking for palindromes", () => {
    expect(palindromeCounter("Level radar", 3)).toBe(2);
    expect(palindromeCounter("Madam", 5)).toBe(1);
  });

  it("should avoid counting non-palindromes", () => {
    expect(palindromeCounter("hello world", 3)).toBe(0);
    expect(palindromeCounter("abc def", 2)).toBe(0);
  });

  it("should handle empty strings", () => {
    expect(palindromeCounter("", 3)).toBe(0);
    expect(palindromeCounter(" ", 3)).toBe(0);
  });
});
