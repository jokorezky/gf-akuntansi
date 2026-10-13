import { Module } from "@nestjs/common";
import { KonfigurasiResolver } from "./konfigurasi.resolver";
import { KonfigurasiService } from "./konfigurasi.service";

@Module({
  providers: [KonfigurasiService, KonfigurasiResolver],
})
export class KonfigurasiModule {}
