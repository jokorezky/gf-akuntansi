import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

export const pgPoolProvider = {
  provide: PG_POOL,
  useFactory: () =>
    new Pool({
      host: process.env.PGHOST ?? "127.0.0.1",
      port: Number(process.env.PGPORT ?? 5435),
      user: process.env.PGUSER ?? "postgres",
      password: process.env.PGPASSWORD ?? "",
      database: process.env.PGDATABASE ?? "indusia-akunting",
      max: 5,
      options: "-c search_path=gf,public",
    }),
};
