import { Module } from "@nestjs/common";
import { LaporanResolver } from "./laporan.resolver";
import { LaporanService } from "./laporan.service";

@Module({
  providers: [LaporanService, LaporanResolver],
})
export class LaporanModule {}
