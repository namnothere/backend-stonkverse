export const config = {
  db: {
    // entities: [`${__dirname}/../../entity/**/*.{js,ts}`],
    // subscribers: [`${__dirname}/../../subscriber/**/*.{js,ts}`],
    // migrations: [`${__dirname}/../../migration/**/*.{js,ts}`],
  },
  graphql: {
    debug: true,
    playground: {
      settings: {
        'request.credentials': 'include',
      },
    },
    autoSchemaFile: true,
    autoTransformHttpErrors: true,
    // cors: { credentials: true },
    // sortSchema: true,
    // installSubscriptionHandlers: true,
  },
  hello: 'world',
  jwt: {
    secret: Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64, 'base64').toString(
      'utf8',
    ),
    refreshSecret: Buffer.from(
      process.env.JWT_PRIVATE_KEY_BASE64,
      'base64',
    ).toString('utf8'),
    expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXP_IN_SEC, 10),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXP_IN_SEC, 10),
  },
};
