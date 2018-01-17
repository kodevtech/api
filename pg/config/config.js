require('dotenv').config();

module.exports = {
    "development": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASS,
        "database": process.env.DB_NAME,
        "host": process.env.DB_HOST,
        "dialect": "postgres"
    },
    "test": {
        "username": process.env.DB_USER,
        "password": process.env.DB_PASS,
        "database": process.env.DB_NAME,
        "host": process.env.DB_HOST,
        "dialect": "postgres"
    },
    "production": {
        "use_env_variable": process.env.DB_CONNECTION_STRING,
        "dialect": "postgres",
        "url": process.env.DB_CONNECTION_STRING, //For migration
    }
};
