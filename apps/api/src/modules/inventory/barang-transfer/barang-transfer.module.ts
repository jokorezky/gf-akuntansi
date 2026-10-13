import { Module } from "@nestjs/common";
import { BarangTransferResolver } from "./barang-transfer.resolver";
import { BarangTransferService } from "./barang-transfer.service";

@Module({
  providers: [BarangTransferService, BarangTransferResolver],
})
export class BarangTransferModule {}
