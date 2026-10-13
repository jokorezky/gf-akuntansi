import { Module } from "@nestjs/common";
import { BarangPindahGudangResolver } from "./barang-pindah-gudang.resolver";
import { BarangPindahGudangService } from "./barang-pindah-gudang.service";

@Module({
  providers: [BarangPindahGudangService, BarangPindahGudangResolver],
})
export class BarangPindahGudangModule {}
