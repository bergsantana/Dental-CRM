import { FactoryProvider } from '@nestjs/common';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';

export const DB_PROVIDER = 'DB_PROVIDER';

export const dbProvider: FactoryProvider<
  NodePgDatabase<Record<string, unknown>>
> = {
  provide: DB_PROVIDER,
  useFactory: () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    return drizzle(pool);
  },
};
