import { Module } from "@nestjs/common";
import { ProduksiResolver } from "./produksi.resolver";
import { ProduksiService } from "./produksi.service";

@Module({
  providers: [ProduksiService, ProduksiResolver],
})
export class ProduksiModule {}
