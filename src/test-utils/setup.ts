import { getDatabaseConnection } from "../utils/getDatabaseConnection";

getDatabaseConnection(true).then(() => process.exit());