const makeRequest = (attempt, callback) => {
  setTimeout(() => {
    const success = Math.random() > 0.9;

    if (success) {
      callback(null, `Request successful on attempt ${attempt}`);
    } else {
      callback(new Error(`Request failed on attempt ${attempt}`), null);
    }
  }, 1000); // Simulated network delay
};

module.exports = makeRequest;
