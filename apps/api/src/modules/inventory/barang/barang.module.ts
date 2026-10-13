import { Module } from "@nestjs/common";
import { BarangResolver } from "./barang.resolver";
import { BarangService } from "./barang.service";

@Module({
  providers: [BarangService, BarangResolver],
})
export class BarangModule {}
