export const config = {
  db: {
    type: process.env.DB_TYPE || 'postgres',
    synchronize: false,
    logging: true,
    url: process.env.DB_URL || 'http://localhost:5432',
    schema: process.env.DB_SCHEMA || 'system',
    extra: {
      connectionLimit: 1000,
    },
    autoLoadEntities: true,
  },
  foo: 'dev-bar',
};
