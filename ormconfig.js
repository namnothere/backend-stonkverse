module.exports = {
  type: 'postgres',
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : null,
  // username: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // database: process.env.DB_NAME,
  url: process.env.DB_URL,
  entities: [`${__dirname}/../src/**/entities/index.{js,ts}`],
  migrations: [`${__dirname}/../src/migration/*.{js,ts}`],
  migrationsRun: false,
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'migrations',
  },
  // Timezone configured on the MySQL server.
  // This is used to typecast server date/time values to JavaScript Date object and vice versa.
  timezone: 'UTC',
  synchronize: true,
  debug: process.env.NODE_ENV === 'development' ? true : false,
};