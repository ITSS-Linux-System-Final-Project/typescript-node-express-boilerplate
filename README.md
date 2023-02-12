# RESTful API Node Server Boilerplate

A boilerplate/starter project for quickly building RESTful APIs using Node.js, Express, and Mongoose.

By running a single command, you will get a production-ready Node.js app installed and fully configured on your machine. The app comes with many built-in features, such as authentication using JWT. For more details, check the features list below.

##  Installation

If you would still prefer to do the installation manually, follow these steps:

Clone the repo:

```bash
git clone https://github.com/ITSS-Linux-System-Final-Project/typescript-node-express-boilerplate.git
cd typescript-node-express-boilerplate
```

Install the dependencies:

```bash
npm i
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```




## Table of Contents

- [Features](#features)
- [Commands](#commands)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Token (JWT) Interface](#token-interface)
- [Redis Storage](#redis-storage)
- [API Documentation](#api-documentation)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Linting](#linting)
- [Contributing](#contributing)

## Features
- **Typesript**
- **NoSQL database**: [MongoDB](https://www.mongodb.com) object data modeling using [Typegoose](https://typegoose.github.io/typegoose/)
- **Authentication and authorization**: using [JWT](http://www.passportjs.org)
- **Validation**: data validation using class-validator [Joi](https://github.com/typestack/class-validator)
- **Error handling**: centralized error handling mechanism
- **API documentation**: with [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Dependency management**: with [NPM](https://www.npmjs.com/)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv) and [cross-env](https://github.com/kentcdodds/cross-env#readme)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **Santizing**: sanitize request data against xss and query injection
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Docker support**
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)
- **Editor config**: consistent editor configuration using [EditorConfig](https://editorconfig.org)

## Commands

Running locally:


```
npm run build
node dist/app.js
```


## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Environment, should be set to `production` for production use
NODE_ENV=

# Server port
PORT=

# MongoDB
MONGODB_CONN_STRING=

# Redis
REDIS_HOST=
REDIS_PORT=

# JWT (Time unit is default to ms if not specified)
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# Swagger UI
# Enables /docs route for Swagger UI if set to `true`
SWAGGER_UI_ENABLED=
SWAGGER_UI_USERNAME=
SWAGGER_UI_PASSWORD=


# mailer
MAIL_PORT=
MAIL_HOST=
MAIL_USER=
MAIL_PASS=

#HTML Email Template path to get to mailTemplates directory
HTML_FILES_ROOT=

#WEBSITE Domain path
WEBSITE_DOMAIN_PATH=
```

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--users\          # Structure your solution by components
 |--auth\           # Structure your solution by components
 |--utils\          # Utility classes and functions shared between components
 |--.eslintrc       # ESLint config
 |--app.js          # Express app
```
## Token interface

```json
{
  "email": "hello@example.com",
  "role": "admin"
}
```

## Redis storage

### Authentication

| Key                             | Value            | TTL                      |
| ------------------------------- | ---------------- | ------------------------ |
| `auth:${email}:${refreshToken}` | `${accessToken}` | Refresh token's duration |
## API Documentation

To view the list of available APIs and their specifications, run the server and go to `http://localhost:3000/docs` in your browser. This documentation page is automatically generated using the [swagger](https://swagger.io/) definitions written as comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /auth/login` - login\
`POST /auth/refresh-tokens` - refresh auth tokens\
`POST /auth/logout` -logout and delete token\
**User routes**:\
`GET /user` - get current logged in user\
`POST /user` - register new user\
`PATCH /user/change/password` - change user password\
`PUT /user/change/profile` - change user profile\
`GET /user/register/verify/:active_token` - verify user token (when register and mail to user)\
`GET /user/forgot-password/verify/:active_token` - verify user token (when using forgot password function and mail to user)\
`POST /user/forgot-password` - send reset password request

## Error Handling

The app has a decentralized error handling mechanism.
The error handling is on each components
```javascript
// below script is on *.controller.ts files
try {
      await this.userService.changePassword(user._id, changePasswordDto);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
});

```
You can throw error on business logic layer
(*.service.ts)
```javascript
async getUserByID(user_id: string) {
    const query = {
      _id: user_id,
    };
    const user = await this.userRepository.getUserDetailById(query);
    if (!user) {
      throw new NotFoundError('This User does not exist !');
    }
    return user;
  }

```

## Validation

Request data is validated using [class-validator](https://github.com/typestack/class-validator). Check the [documentation](https://github.com/typestack/class-validator) for more details on how to write validations 

```javascript
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  old_password: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  new_password: string;
}

```

## Authentication

To require authentication for certain routes, you can use the `@Authorized([Roles])` decorator (this boilerplate always required roles to authenticate, so it will authenticate and authorize at the same time).

```javascript
  @Get('', { transformResponse: false })
  @OpenAPI({
    security: [{ BearerAuth: [] }],
    description: 'Gets details of current logged-in user  ',
  })
  @Authorized(['admin', 'staff'])
  getUserByEmail(@CurrentUser({ required: true }) user: UserDocument) {
    return this.userService.getUserByEmail(user.email);
  }
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

**Generating Access Tokens**:

An access token can be generated by making a successful call to login (`POST /auth/login`) endpoints. The response of these endpoints also contains refresh tokens (explained below).

An access token is valid for 30 minutes. You can modify this expiration time by changing the `JWT_EXPIRES_IN` environment variable in the .env file.

**Refreshing Access Tokens**:

After the access token expires, a new access token can be generated, by making a call to the refresh token endpoint (`POST /auth/refresh-tokens`) and sending along a valid refresh token in the request body. This call returns a new access token and a new refresh token.

A refresh token is valid for 30 days. You can modify this expiration time by changing the `JWT_REFRESH_EXPIRES_IN` environment variable in the .env file.

## Authorization

The `@Authorized([Roles])` can also be used to require certain rights/permissions to access a route.

```javascript
@OpenAPI({
    security: [{ BearerAuth: [] }],
    description: 'Change password of current logged-in user',
  })
  @Authorized(['admin', 'staff']) // Each route will have independent roles required to be called
  @Patch('/change/password')
  async changePassword(
    @CurrentUser({ required: true }) user: UserDocument,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      await this.userService.changePassword(user._id, changePasswordDto);
      return {
        message: 'Success',
      };
    } catch (e) {
      throw new BadRequestError(e.message);
    }
  }
```

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.


## Linting

Linting is done using [ESLint](https://eslint.org/) and [Prettier](https://prettier.io).

In this app, ESLint is configured to follow the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-base) with some modifications. It also extends [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) to turn off all rules that are unnecessary or might conflict with Prettier.

To modify the ESLint configuration, update the `.eslintrc` file. To modify the Prettier configuration, update the `.prettierrc` file.

To prevent a certain file or directory from being linted, add it to `.eslintignore` and `.prettierignore`.

To maintain a consistent coding style across different IDEs, the project contains `.editorconfig`

## Contributing

Contributions are more than welcome! Please check out the [contributing guide](CONTRIBUTING.md).

## Inspirations

- [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate) 
This README.md file is based on his one. 
## License

[MIT](LICENSE)


