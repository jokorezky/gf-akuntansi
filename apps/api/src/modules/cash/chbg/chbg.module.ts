import { Module } from "@nestjs/common";
import { ChbgResolver } from "./chbg.resolver";
import { ChbgService } from "./chbg.service";

@Module({
  providers: [ChbgService, ChbgResolver],
})
export class ChbgModule {}
