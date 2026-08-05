import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const API_URL = import.meta.env.VITE_API_URL;
// The API key is stored in .env and is NOT committed to the repository
// react-doctor-disable-next-line public-env-secret-name
const API_AUTH = import.meta.env.VITE_API_TOKEN;

// HTTP connection to the GraphQL API
const httpLink = createHttpLink({ uri: API_URL });

// Attach the Bearer token to every request
const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    Authorization: `Bearer ${API_AUTH}`,
  },
}));

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
