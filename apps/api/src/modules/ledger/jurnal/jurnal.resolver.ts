import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { JurnalService } from "./jurnal.service";
import { Jurnal, JurnalInput, JurnalPage, BukuBesarPage, BukuBesarMutasi, LaporanKeuanganRow } from "./jurnal.types";

@Resolver(() => Jurnal)
export class JurnalResolver {
  constructor(private readonly service: JurnalService) {}

  @Query(() => JurnalPage)
  jurnalList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Jurnal, { nullable: true })
  jurnalById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => BukuBesarPage)
  bukuBesarList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.bukuBesarList(limit ?? 100, offset ?? 0, q);
  }

  @Query(() => BukuBesarMutasi, { nullable: true })
  bukuBesarMutasi(
    @Args("perkirId", { type: () => Int }) perkirId: number,
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
    @Args("urutTglInput", { nullable: true }) urutTglInput?: boolean,
  ) {
    return this.service.bukuBesarMutasi(perkirId, dari, sampai, urutTglInput ?? false);
  }

  @Query(() => [LaporanKeuanganRow])
  laporanKeuanganList(
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
  ) {
    return this.service.laporanKeuanganList(dari, sampai);
  }

  @Mutation(() => Jurnal)
  createJurnal(@Args("input") input: JurnalInput) {
    return this.service.create(input);
  }

  @Mutation(() => Jurnal, { nullable: true })
  updateJurnal(@Args("id", { type: () => Int }) id: number, @Args("input") input: JurnalInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteJurnal(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
