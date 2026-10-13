import { Args, Int, Query, Resolver } from "@nestjs/graphql";
import { GlChecksService } from "./gl-checks.service";
import { GlCekKursPage, GlCekPerantaraPage, GlSaldoAkhirPage } from "./gl-checks.types";

@Resolver()
export class GlChecksResolver {
  constructor(private readonly service: GlChecksService) {}

  @Query(() => GlCekKursPage)
  glCekKurs(
    @Args("mu", { nullable: true }) mu?: string,
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
  ) {
    return this.service.cekKurs(mu, dari, sampai, limit ?? 500, offset ?? 0);
  }

  @Query(() => [String])
  glMuList() {
    return this.service.muList();
  }

  @Query(() => GlCekPerantaraPage)
  glCekPerantara(
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
  ) {
    return this.service.cekPerantara(dari, sampai, limit ?? 500, offset ?? 0);
  }

  @Query(() => GlSaldoAkhirPage)
  glSaldoAkhir(
    @Args("kelas", { nullable: true }) kelas?: string,
    @Args("golongan", { nullable: true }) golongan?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
  ) {
    return this.service.saldoAkhir(kelas, golongan, sampai, limit ?? 500, offset ?? 0);
  }
}
