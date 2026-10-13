import { Module } from "@nestjs/common";
import { PosResolver } from "./pos.resolver";
import { PosService } from "./pos.service";

@Module({
  providers: [PosService, PosResolver],
})
export class PosModule {}
