import { Module } from "@nestjs/common";
import { ReturPembelianResolver } from "./retur-pembelian.resolver";
import { ReturPembelianService } from "./retur-pembelian.service";

@Module({
  providers: [ReturPembelianService, ReturPembelianResolver],
})
export class ReturPembelianModule {}
