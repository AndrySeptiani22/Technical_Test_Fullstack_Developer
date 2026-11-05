import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    isProd
      ? path.join(__dirname, "../../domain/entities/**/*.entity.js") // production (compiled)
      : path.join(__dirname, "../../domain/entities/**/*.entity.ts"), // dev (ts-node)
  ],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
});

export default dataSource;
