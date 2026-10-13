import { Module } from "@nestjs/common";
import { TipePembayaranResolver } from "./tipe-pembayaran.resolver";
import { TipePembayaranService } from "./tipe-pembayaran.service";

@Module({
  providers: [TipePembayaranService, TipePembayaranResolver],
})
export class TipePembayaranModule {}
