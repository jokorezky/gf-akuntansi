import { Module } from "@nestjs/common";
import { ReturPenjualanResolver } from "./retur-penjualan.resolver";
import { ReturPenjualanService } from "./retur-penjualan.service";

@Module({
  providers: [ReturPenjualanService, ReturPenjualanResolver],
})
export class ReturPenjualanModule {}
