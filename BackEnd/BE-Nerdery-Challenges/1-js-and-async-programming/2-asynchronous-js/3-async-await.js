/*

  Challenge 3: Most Common Subscription for Harsh Reviewers

  Find the most common subscription among users who dislike more movies than they like.
  Use the methods in utils/mocked-api to get user and rating data.
  Check each user's likes vs. dislikes, filter those with more dislikes, and return the most frequent subscription.

  Requesites:
    - Use await with the methods from utils/mocked-api to get the data
    - Make sure to return a string containing the name of the most common subscription
*/

/**
 * Logs the most common subscription among users
 * who disliked more movies than they liked.
 *
 * @returns {Promise<string>} Logs the subscription name as a string.
 */
const {
  getUsers,
  getLikedMovies,
  getDislikedMovies,
  getUserSubscriptionByUserId,
} = require("./utils/mocked-api");

const getCommonDislikedSubscription = async () => {
  const [users, likedMovies, dislikedMovies] = await Promise.all([
    getUsers(),
    getLikedMovies(),
    getDislikedMovies(),
  ]);

  const harshReviewers = users.filter((user) => {
    const liked = likedMovies.find((l) => l.userId === user.id);
    const disliked = dislikedMovies.find((d) => d.userId === user.id);
    const likedCount = liked ? liked.movies.length : 0;
    const dislikedCount = disliked ? disliked.movies.length : 0;
    return dislikedCount > likedCount;
  });

  const subscriptions = await Promise.all(
    harshReviewers.map((user) => getUserSubscriptionByUserId(user.id))
  );

  const counts = {};
  for (const sub of subscriptions) {
    counts[sub.subscription] = (counts[sub.subscription] || 0) + 1;
  }

  let mostCommon = "";
  let maxCount = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (count > maxCount) {
      mostCommon = name;
      maxCount = count;
    }
  }

  return mostCommon;
};

getCommonDislikedSubscription().then((subscription) => {
  console.log("Common more dislike subscription is:", subscription);
});
