import { Module } from "@nestjs/common";
import { DepositPembelianResolver } from "./deposit-pembelian.resolver";
import { DepositPembelianService } from "./deposit-pembelian.service";

@Module({
  providers: [DepositPembelianService, DepositPembelianResolver],
})
export class DepositPembelianModule {}
