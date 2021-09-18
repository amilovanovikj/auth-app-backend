import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient } from "redis";
import cors from "cors";
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import { UserResolver } from "./resolvers/UserResolver";
import { AuthContext } from "./types";

const main = async () => {
  const connection = await createConnection();
  
  // await connection.runMigrations();
  connection.synchronize();

  const app = express();

  const SessionStore = connectRedis(session);
  const redisClient = createClient(6380, process.env.REDIS_URL, {
    auth_pass: process.env.REDIS_KEY,
    tls: {
      servername: process.env.REDIS_URL
    }
  });
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new SessionStore({
        client: redisClient,
        disableTouch: true,
      }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 3600 * 24 * 7, // one week
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
      },
    }), 
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        UserResolver
      ],
      validate: false
    }),
    context: ({ req, res }): AuthContext => ({ req, res }),
  });

  await apolloServer.start()
  apolloServer.applyMiddleware({ app, cors: false })
  // apolloServer.applyMiddleware({ app })

  app.listen(4000, () => {
    console.log('server started on port 4000');
  });
}

main().catch((err) => {
  console.error(err);
});