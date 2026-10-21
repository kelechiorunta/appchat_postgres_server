import knex from "knex";
import { Knex } from "knex";
import dotenv from 'dotenv';
import path from "path";
import KnexConfig from '../knexfile'

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

// Create a postgres db instance with the knexfile configuration

const cachedClient = globalThis as unknown as {
  db?: Knex
}

const db = cachedClient.db ?? knex(KnexConfig as Knex.Config);

// Create connection asynchronously
const createDBConnection = async (): Promise<boolean> => {
    try {
        await db.raw('SELECT 1')
        console.log("Database connection to docker connected successfully")
        return true
    } catch (error) {
        console.error(error instanceof Error? error.message: error)
        return false
    }
}

export { createDBConnection }

export default db;