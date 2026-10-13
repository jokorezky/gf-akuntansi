import { Module } from "@nestjs/common";
import { KasResolver } from "./kas.resolver";
import { KasService } from "./kas.service";

@Module({
  providers: [KasService, KasResolver],
})
export class KasModule {}
