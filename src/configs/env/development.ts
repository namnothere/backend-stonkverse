export const config = {
  db: {
    type: process.env.DB_TYPE || 'postgres',
    synchronize: false,
    logging: true,
    // host: process.env.DB_HOST || '127.0.0.1',
    // port: process.env.DB_PORT || 5432,
    // username: process.env.DB_USER || 'username',
    // password: process.env.DB_PASS || 'password',
    // database: process.env.DB_NAME || 'dbname',
    url: process.env.DB_URL || 'http://localhost:5432',
    schema: process.env.DB_SCHEMA || 'system',
    extra: {
      connectionLimit: 1000,
    },
    autoLoadEntities: true,
  },
  foo: 'dev-bar',
};
