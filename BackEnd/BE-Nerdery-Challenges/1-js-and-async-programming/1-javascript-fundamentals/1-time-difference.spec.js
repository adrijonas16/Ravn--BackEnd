const timeDifference = require("./1-time-difference");

describe("timeDifference", () => {
  it("should return the difference in exact minutes", () => {
    expect(timeDifference(5400, 3600)).toBe("00:30:00");
    expect(timeDifference(3600, 5400)).toBe("00:30:00");
    expect(timeDifference(5400, 6000)).toBe("00:10:00");
  });

  it("should return the difference in exact seconds", () => {
    expect(timeDifference(5400, 5410)).toBe("00:00:10");
    expect(timeDifference(5410, 5400)).toBe("00:00:10");
    expect(timeDifference(3000, 3037)).toBe("00:00:37");
  });

  it("should return the difference in exact hours", () => {
    expect(timeDifference(7200, 3600)).toBe("01:00:00");
    expect(timeDifference(7200, 14400)).toBe("02:00:00");
    expect(timeDifference(7200, 21600)).toBe("04:00:00");
    expect(timeDifference(7200, 28800)).toBe("06:00:00");
  });

  it("should return combined hours and minutes and seconds", () => {
    expect(timeDifference(72000, 31199)).toBe("11:20:01");
    expect(timeDifference(7200, 1800)).toBe("01:30:00");
    expect(timeDifference(3510, 3600)).toBe("00:01:30");
    expect(timeDifference(3600, 3510)).toBe("00:01:30");
    expect(timeDifference(27000, 11470)).toBe("04:18:50");
  });
});
