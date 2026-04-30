"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const pg_1 = require("pg");
async function main() {
    const url = process.env.DATABASE_URL ?? 'postgres://dental:dental@localhost:5432/dental_crm';
    const pool = new pg_1.Pool({ connectionString: url });
    const db = (0, node_postgres_1.drizzle)(pool);
    await (0, migrator_1.migrate)(db, { migrationsFolder: './drizzle' });
    await pool.end();
    console.log('migrations applied');
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map