import { Module } from "@nestjs/common";
import { UtilResolver } from "./util.resolver";
import { UtilService } from "./util.service";

@Module({
  providers: [UtilResolver, UtilService],
})
export class UtilModule {}
