/* 
Challenge: "Find Majority Element";

The function findMajorityElement accepts an array of numbers and returns the majority element if it exists, otherwise returns null. The majority element is the element that appears more than n/2 (floor of that division) times in the array.

Requirements:
- The function should handle arrays of any length.
- The function should return the majority element if it exists, otherwise return null.
- The function should be efficient and handle large arrays.
- The function should not modify the original array.

Example:
findMajorityElement([1, 2, 3, 1, 1]); // Expected output: 1
findMajorityElement([1, 2, 3, 4]); // Expected output: null
findMajorityElement([1, 1, 2, 2, 2]); // Expected output: 2
findMajorityElement([1, 2, 2, 3, 3, 3]); // Expected output: null
findMajorityElement([1, 2, 3, 4, 5]); // Expected output: null


*/

const findMajorityElement = (arr) => {
  if (arr.length === 0) return null;
  // Boyer-Moore majority vote
  let candidate = arr[0];
  let count = 0;
  for (const num of arr) {
    if (count === 0) candidate = num;
    count += num === candidate ? 1 : -1;
  }
  // Verify
  const total = arr.filter((x) => x === candidate).length;
  return total > Math.floor(arr.length / 2) ? candidate : null;
};

module.exports = findMajorityElement;
