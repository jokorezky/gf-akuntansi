import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { LaporanService } from "./laporan.service";
import { LaporanCatalog, LaporanHasil } from "./laporan.types";

@Resolver()
export class LaporanResolver {
  constructor(private readonly service: LaporanService) {}

  @Query(() => LaporanCatalog)
  laporanCatalog() {
    return this.service.catalog();
  }

  @Query(() => LaporanHasil)
  laporanHasil(
    @Args("kode") kode: string,
    @Args("q", { nullable: true }) q?: string,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
  ) {
    return this.service.hasil(kode, q, limit ?? 500, offset ?? 0);
  }
}
