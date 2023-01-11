import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  createHttpLink,
  split,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { readAuthToken } from './utils';
import { logout } from './auth';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = createHttpLink({
  uri: `${process.env.REACT_APP_SERVER_HOST}/graphql`,
  headers: {
    get 'x-api-token'() {
      return readAuthToken();
    },
  },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `${process.env.REACT_APP_WEBSOCKET_HOST}/graphql`,
    connectionParams: {
      get apiToken() {
        return readAuthToken();
      },
    },
  })
);

const removeTokenLink = onError(({ graphQLErrors }) => {
  graphQLErrors?.forEach((error) => {
    if (error.extensions.code === 'UNAUTHENTICATED') {
      logout();
    }
  });
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  ApolloLink.from([removeTokenLink, httpLink])
);

export default new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    possibleTypes: {
      PlaybackItem: ['Track', 'Episode'],
      PlaylistTrack: ['Track', 'Episode'],
    },
    typePolicies: {
      Copyright: {
        keyFields: false,
      },
      Followers: {
        keyFields: false,
      },
      Image: {
        keyFields: ['url'],
      },
      Player: {
        keyFields: false,
      },
      PlaybackState: {
        keyFields: false,
      },
      Query: {
        fields: {
          me: {
            merge: true,
          },
        },
      },
      ReleaseDate: {
        keyFields: false,
      },
    },
  }),
});
