import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.resolve(configDirectory, "../../.env");
config({
  path: envFilePath,
});

const port = process.env.PORT;
if (!port) {
  throw new Error("port is missing", { cause: 500 });
}

const DB_NAME = process.env.DB_NAME,
  DB_USER = process.env.DB_USER,
  DB_PASSWORD = process.env.DB_PASSWORD,
  DB_PORT = process.env.DB_PORT,
  DB_HOST = process.env.DB_HOST,
  DB_DIALECT = process.env.DB_DIALECT;

export default {
  port,
  DB: {
    name: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    db_port: Number(DB_PORT),
    host: DB_HOST,
    dialect: DB_DIALECT,
  },
};
