require("dotenv").config();
import { createConnection } from "typeorm";

export const testConn = (drop: boolean = false) => { 
  return createConnection({
    type: "mariadb",
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: +process.env.TYPEORM_PORT!,
    entities: ["src/entities/**/*.ts"],
    migrations: ["src/migrations/**/*.ts"],
    dropSchema: drop,
    synchronize: true
  })
}