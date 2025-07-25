export const config = {
  db: {
    uri: process.env.DB_URI || 'mongodb://127.0.0.1:27017/dbname',
    type: process.env.DB_TYPE || 'mysql',
    synchronize: false,
    logging: false,
    replication: {
      master: {
        host: process.env.DB_HOST || 'masterHost',
        port: process.env.DB_PORT || 3306,
        username: process.env.DB_USER || 'username',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'dbname',
      },
      slaves: [
        {
          // fix if necessary
          host: 'slaveHost',
          port: 3306,
          username: 'username',
          password: process.env.DB_PASSWORD || 'password',
          database: 'dbname',
        },
      ],
    },
    extra: {
      connectionLimit: 30,
    },
    autoLoadEntities: true,
  },
  graphql: {
    debug: false,
    playground: false,
  },
  foo: 'pro-bar',
};