import { expressMiddleware } from '@apollo/server/express4';

const port = process.env.PORT ?? '4002';
const routerSecret = process.env.ROUTER_SECRET;
import morgan from 'morgan';
import chalk from 'chalk';
import SpotifyAPI from './dataSources/spotify';
import { json } from 'body-parser';
import cors from 'cors';
import { MockedSpotifyDataSource, addUser } from './utils/mocks';
import logger from './logger';
import {
  app,
  callbackApolloServer,
  checkRouterSecret,
  httpServer,
  wsApolloServer,
} from './utils/server';

morgan.token('operationName', (req) => {
  if (!req?.body?.operationName) {
    return '';
  }

  return chalk.blue(req.body.operationName);
});

morgan.token('variables', (req) => {
  if (!req?.body?.variables) {
    return '';
  }

  return JSON.stringify({ variables: req.body.variables });
});

const loggerMiddleware = morgan(
  ':method :url :status :response-time ms :operationName :variables',
  {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }
);

async function main() {
  // We currently are building 2 instances of Apollo Server to host subscriptions
  // in both callback and websocket form.
  //
  // The Cloud Apollo Router offering currently only support websockets while the
  // self-hosted Enterprise Apollo Router also support the HTTP callback protocol
  // https://www.apollographql.com/docs/router/executing-operations/subscription-callback-protocol
  //
  // You would normally only want to implement one of these
  // You cannot run callback subscriptions and websocket subscriptions in the same Apollo Server instance
  await callbackApolloServer.start();
  await wsApolloServer.start();

  const context = async ({ req }) => {
    checkRouterSecret(req.headers['router-authorization'] as string);
    const token = req.get('authorization');
    const defaultCountryCode = req.get('country-code') ?? 'US';

    if (!token) {
      const userIdForMocks = req.get('referer') ?? 'default';
      addUser(userIdForMocks);

      return {
        defaultCountryCode,
        dataSources: {
          spotify: new MockedSpotifyDataSource(userIdForMocks),
        },
      };
    }

    return {
      defaultCountryCode,
      dataSources: {
        spotify: new SpotifyAPI({
          cache: callbackApolloServer.cache,
          token,
        }),
      },
    };
  };

  app.use(loggerMiddleware);

  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(callbackApolloServer, {
      context,
    })
  );
  app.use(
    '/',
    cors(),
    json(),
    expressMiddleware(wsApolloServer, {
      context,
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log(`🚀 Subscription endpoint ready at ws://localhost:${port}`);
}

main();
