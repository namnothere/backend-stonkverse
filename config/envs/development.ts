// export const config = {
//   db: {
//     type: process.env.DB_TYPE || 'mysql',
//     synchronize: false,
//     logging: true,
//     host: process.env.DB_HOST || '127.0.0.1',
//     port: process.env.DB_PORT || 3306,
//     username: process.env.DB_USER || 'username',
//     password: process.env.DB_PASSWORD || 'password',
//     database: process.env.DB_NAME || 'dbname',
//     extra: {
//       connectionLimit: 10,
//     },
//     autoLoadEntities: true,
//   },
//   foo: 'dev-bar',
// };

export const config = {
  db: {
    uri: process.env.DB_URI || 'mongodb://127.0.0.1:27017/dbname',
    options: {
      user: process.env.DB_USER || 'username',
      pass: process.env.DB_PASSWORD || 'password',
      // authSource: 'admin',
    },
  },
  foo: 'dev-bar',
};