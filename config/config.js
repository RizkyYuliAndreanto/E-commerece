
module.exports = {
  development: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "my_app",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "mysql",
    logging: console.log, // Untuk debugging development
  },
  test: {
    username: process.env.TEST_DB_USERNAME || "root",
    password: process.env.TEST_DB_PASSWORD || null,
    database: process.env.TEST_DB_NAME || "my_app_test",
    host: process.env.TEST_DB_HOST || "127.0.0.1",
    dialect: process.env.TEST_DB_DIALECT || "sqlite",
    storage: process.env.TEST_DB_STORAGE || ":memory:", // SQLite in-memory
    logging: false, // Nonaktifkan logging saat test
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    dialect: process.env.PROD_DB_DIALECT || "mysql",
    logging: false, // Nonaktifkan logging di production
  },
};
