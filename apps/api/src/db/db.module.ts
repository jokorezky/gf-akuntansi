import { Global, Module } from "@nestjs/common";
import { pgPoolProvider, PG_POOL } from "./pg.provider";

@Global()
@Module({
  providers: [pgPoolProvider],
  exports: [PG_POOL],
})
export class DbModule {}
