import { Global, Module } from "@nestjs/common";
import { createDb, type Database } from "@sales/db";
import { loadEnv, type Env } from "../env";
import { DB, ENV } from "./db.tokens";

@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: (): Env => loadEnv(),
    },
    {
      provide: DB,
      inject: [ENV],
      useFactory: (env: Env): Database => createDb(env.DATABASE_URL).db,
    },
  ],
  exports: [DB, ENV],
})
export class DbModule {}
