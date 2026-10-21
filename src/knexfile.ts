import type { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';

// Expose env variables
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5441,
      user: process.env.DB_USER as string,
      password: process.env.DB_PWD as string,
      database: process.env.DB_NAME as string
    },
    debug: true,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'seeds')
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5441,
      user: process.env.DB_USER as string,
      password: process.env.DB_PWD as string,
      database: process.env.DB_NAME as string
    },
    debug: true,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5441,
      user: process.env.DB_USER as string,
      password: process.env.DB_PWD as string,
      database: process.env.DB_NAME as string
    },
    debug: true,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    }
  }
};

export default config['development'];
// module.exports = config;
