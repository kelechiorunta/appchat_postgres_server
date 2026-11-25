import type { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';

const dirname = process.env.NODE_ENV === 'development'? path.resolve() : __dirname
// Expose env variables
dotenv.config({
  path: path.resolve(dirname, "../.env"),
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
      database: process.env.DB_DEV_NAME as string
    },
    debug: true,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(dirname, 'migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
    seeds: {
      directory: path.join(dirname, 'seeds')
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5441,
      user: process.env.DB_USER as string,
      password: process.env.DB_PWD as string,
      database: process.env.DB_DEV_NAME as string
    },
    debug: true,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(dirname, 'migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: 'db',
      port: 5432,
      user: process.env.DB_USER as string,
      password: process.env.DB_PWD as string,
      database: process.env.DB_PROD_NAME as string
    },
    debug: false,
    pool: { min: 0, max: 7 },
    migrations: {
      directory: path.join(dirname, 'migrations'),
      tableName: 'knex_migrations',
      // extension: 'ts',
      loadExtensions: ['.js'],
    },
    seeds: {
      directory: path.join(dirname, 'seeds'),
      extension: 'js'
    }
  }
};

const environment = process.env.NODE_ENV || 'development';

console.log('Knex environment:', environment);

export default config[environment];
// module.exports = config;
