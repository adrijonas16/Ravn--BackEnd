const getUsers = () => {
  return new Promise((resolve) => {
    resolve([
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
      { id: 3, name: "Alice Johnson", age: 28 },
      { id: 4, name: "Bob Brown", age: 35 },
      { id: 5, name: "Charlie White", age: 22 },
      { id: 6, name: "David Black", age: 40 },
      { id: 7, name: "Eva Green", age: 29 },
      { id: 8, name: "Frank Blue", age: 31 },
      { id: 9, name: "Grace Yellow", age: 27 },
      { id: 10, name: "Hank Red", age: 33 },
    ]);
  });
};

// Global movie catalog for consistent IDs
const movieCatalog = {
  Inception: "m1",
  "The Shawshank Redemption": "m2",
  "Pulp Fiction": "m3",
  "The Godfather": "m4",
  "Forrest Gump": "m5",
  Gladiator: "m6",
  Braveheart: "m7",
  "The Silence of the Lambs": "m8",
  "Jurassic Park": "m9",
  "Star Wars": "m10",
  "Harry Potter": "m11",
  "Finding Nemo": "m12",
  "Toy Story": "m13",
  Twilight: "m14",
  "Fifty Shades of Grey": "m15",
  Cats: "m16",
  Transformers: "m17",
  "Fast & Furious": "m18",
  "The Room": "m19",
  "Fast and Furious": "m20",
  "The Last Airbender": "m21",
  Sharknado: "m22",
  Gigli: "m23",
  Velocipastor: "m24",
  "Battlefield Earth": "m25",
  "The Love Guru": "m26",
  "Jack and Jill": "m27",
  "Movie 43": "m28",
  "The Emoji Movie": "m29",
  "Saving Christmas": "m30",
  "Batman v Superman": "m31",
  "The Happening": "m32",
  Birdemic: "m33",
  "Jaws: The Revenge": "m34",
  "Super Mario Bros.": "m35",
};

const toMovieObject = (title) => ({ id: movieCatalog[title], title });

const getLikedMovies = () => {
  return new Promise((resolve) => {
    resolve([
      { userId: 1, movies: [toMovieObject("Inception")] },
      {
        userId: 2,
        movies: [
          toMovieObject("The Shawshank Redemption"),
          toMovieObject("Pulp Fiction"),
        ],
      },
      { userId: 3, movies: [toMovieObject("The Godfather")] },
      { userId: 4, movies: [toMovieObject("Forrest Gump")] },
      { userId: 5, movies: [] },
      {
        userId: 6,
        movies: [toMovieObject("Gladiator"), toMovieObject("Braveheart")],
      },
      { userId: 7, movies: [toMovieObject("The Silence of the Lambs")] },
      {
        userId: 8,
        movies: [toMovieObject("Jurassic Park"), toMovieObject("Star Wars")],
      },
      { userId: 9, movies: [toMovieObject("Harry Potter")] },
      {
        userId: 10,
        movies: [toMovieObject("Finding Nemo"), toMovieObject("Toy Story")],
      },
    ]);
  });
};

const getDislikedMovies = () => {
  return new Promise((resolve) => {
    resolve([
      {
        userId: 1,
        movies: [
          toMovieObject("Twilight"),
          toMovieObject("Fifty Shades of Grey"),
          toMovieObject("Cats"),
        ],
      },
      {
        userId: 2,
        movies: [
          toMovieObject("Transformers"),
          toMovieObject("Fast & Furious"),
        ],
      },
      {
        userId: 3,
        movies: [
          toMovieObject("The Room"),
          toMovieObject("Cats"),
          toMovieObject("Fast and Furious"),
          toMovieObject("The Last Airbender"),
        ],
      },
      {
        userId: 4,
        movies: [
          toMovieObject("Sharknado"),
          toMovieObject("Gigli"),
          toMovieObject("Velocipastor"),
        ],
      },
      {
        userId: 5,
        movies: [
          toMovieObject("Battlefield Earth"),
          toMovieObject("The Love Guru"),
        ],
      },
      {
        userId: 6,
        movies: [toMovieObject("Jack and Jill"), toMovieObject("Movie 43")],
      },
      {
        userId: 7,
        movies: [
          toMovieObject("The Emoji Movie"),
          toMovieObject("Saving Christmas"),
          toMovieObject("Velocipastor"),
        ],
      },
      {
        userId: 8,
        movies: [
          toMovieObject("The Last Airbender"),
          toMovieObject("Batman v Superman"),
        ],
      },
      {
        userId: 9,
        movies: [
          toMovieObject("The Happening"),
          toMovieObject("Birdemic"),
          toMovieObject("Cats"),
        ],
      },
      {
        userId: 10,
        movies: [
          toMovieObject("Jaws: The Revenge"),
          toMovieObject("Super Mario Bros."),
        ],
      },
    ]);
  });
};

const getUserSubscriptionByUserId = (userId) => {
  return new Promise((resolve) => {
    const subscriptions = [
      { userId: 1, subscription: "Basic" },
      { userId: 2, subscription: "Premium" },
      { userId: 3, subscription: "Basic" },
      { userId: 4, subscription: "Basic" },
      { userId: 5, subscription: "Basic" },
      { userId: 6, subscription: "Premium" },
      { userId: 7, subscription: "Premium" },
      { userId: 8, subscription: "Premium" },
      { userId: 9, subscription: "Basic" },
      { userId: 10, subscription: "Premium" },
    ];
    const subscription = subscriptions.find((user) => user.userId === userId);
    resolve(subscription);
  });
};

module.exports = {
  getUsers,
  getDislikedMovies,
  getLikedMovies,
  getUserSubscriptionByUserId,
};
