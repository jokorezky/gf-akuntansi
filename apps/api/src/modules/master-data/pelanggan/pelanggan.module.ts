import { Module } from "@nestjs/common";
import { PelangganResolver } from "./pelanggan.resolver";
import { PelangganService } from "./pelanggan.service";

@Module({
  providers: [PelangganService, PelangganResolver],
})
export class PelangganModule {}
