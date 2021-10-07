require("dotenv").config();
import { createConnection, LoggerOptions } from "typeorm";
import fs from 'fs';

export const getDatabaseConnection = (drop: boolean = false) => { 
  return createConnection({
    type: "mariadb",
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    port: +process.env.TYPEORM_PORT!,
    logging: process.env.TYPEORM_LOGGING as LoggerOptions,
    entities: [process.env.TYPEORM_ENTITIES!],
    migrations: [process.env.TYPEORM_MIGRATIONS!],
    dropSchema: drop,
    synchronize: true,
    ssl:{
      ca: fs.readFileSync(process.env.CERT_LOCATION!)
    },
  })
}