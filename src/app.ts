import 'reflect-metadata';
import express, { Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  Action,
  getMetadataArgsStorage,
  RoutingControllersOptions,
  UnauthorizedError,
  useExpressServer,
} from 'routing-controllers';
import { defaultMetadataStorage } from 'class-transformer/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUiExpress from 'swagger-ui-express';
import expressBasicAuth from 'express-basic-auth';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import './config/config.service';
import { isJWT } from 'class-validator';
import * as http from 'http';
import * as socketio from 'socket.io';
import { redisClient } from './config/redis-client';

import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { UserModel } from './user/user.model';

async function authorizationChecker(action: Action, roles: string[]) {
  const req: Request = action.request;
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !isJWT(token)) {
    throw new UnauthorizedError('Unauthorized Error !');
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const { email, role } = user as Record<string, string>;
    const userTokens = await redisClient.keys(`auth:${email}*`);
    if (!roles.includes(role)) {
      return false;
    }
    return userTokens.some(async (key) => {
      const currentToken = await redisClient.get(key);
      return currentToken === token;
    });
  } catch (e) {
    throw new UnauthorizedError(e.message);
  }
}
async function currentUserChecker(action: Action) {
  const req: Request = action.request;
  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(' ');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const curUser: any = jwt.decode(token);
  try {
    // TODO: in prod: add filter: del_flag:false,status: 1
    const user = await UserModel.findOne({ email: curUser.email }).lean();
    return user;
  } catch (e) {
    return null;
  }
}
function bootstrap() {
  mongoose
    .connect(process.env.MONGODB_CONN_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log('MongoDB connected!');
    })
    .catch((e) => {
      console.log(e);
      console.log('MongoDB connection error, exitting.');
      process.exit(1);
    });

  const app = express();
  const env: 'development' | 'production' = app.get('env');

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(cors());
  app.use(express.json());

  const routingControllersOptions: RoutingControllersOptions = {
    plainToClassTransformOptions: {
      excludeExtraneousValues: true,
    },
    controllers: [
      UserController,
      AuthController,
    ],
    authorizationChecker,
    currentUserChecker,
  };
  useExpressServer(app, routingControllersOptions);

  if (process.env.SWAGGER_UI_ENABLED === 'true') {
    console.log('Swagger UI is enabled on /docs route!');
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix: '#/components/schemas/',
    });
    const storage = getMetadataArgsStorage();
    const serverPrefix = process.env.SWAGGER_UI_SERVER_PREFIX || '';
    const servers = serverPrefix !== '' ? [{ url: serverPrefix }] : [];

    const spec = routingControllersToSpec(storage, routingControllersOptions, {
      servers,
      components: {
        schemas,
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    });

    app.use(
      '/docs',
      expressBasicAuth({
        users: {
          [process.env.SWAGGER_UI_USERNAME]: process.env.SWAGGER_UI_PASSWORD,
        },
        challenge: true,
      }),
      swaggerUiExpress.serve,
      swaggerUiExpress.setup(spec),
    );
  }

  const PORT = Number.parseInt(process.env.PORT, 10) || 7000;
  const server = http.createServer(app);
  const io = new socketio.Server(server, {
    cors: {
      origin: '*', // this must be config with client origin in the future
    },
  });
  server.listen(PORT, () => {
    console.log(`Express app running on port ${PORT} in ${env} mode!`);
  });
  global.io = io;
  io.on('connection', (socket) => {
    socket.on('join', async (data) => {
      socket.join(data.user_id); // join user into socket io room
    });
  });
  app.all('*', (req, res) => {
    if (!res.headersSent) {
      res.status(404).send('Invalid request.');
    }
  });
}

bootstrap();
process.on('exit', () => {
  redisClient.nodeRedis.quit();
  mongoose.disconnect();
});
