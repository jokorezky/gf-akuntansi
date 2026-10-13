import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BarangService } from "./barang.service";
import { GrpsmkRef, BarangKeluar, BarangKeluarInput, BarangKeluarPage, BarangMasuk, BarangMasukInput, BarangMasukPage, BarangExpiredPage, KartuStockPage } from "./barang.types";

@Resolver()
export class BarangResolver {
  constructor(private readonly service: BarangService) {}

  @Query(() => BarangMasukPage)
  barangMasukList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.listMasuk(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => BarangMasuk, { nullable: true })
  barangMasukById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byIdMasuk(id);
  }

  @Query(() => [GrpsmkRef])
  grpsmkRefList() {
    return this.service.grpsmkRef();
  }

  @Mutation(() => BarangMasuk)
  createBarangMasuk(@Args("input") input: BarangMasukInput) {
    return this.service.createMasuk(input);
  }

  @Mutation(() => BarangMasuk, { nullable: true })
  updateBarangMasuk(@Args("id", { type: () => Int }) id: number, @Args("input") input: BarangMasukInput) {
    return this.service.updateMasuk(id, input);
  }

  @Mutation(() => Boolean)
  deleteBarangMasuk(@Args("id", { type: () => Int }) id: number) {
    return this.service.deleteMasuk(id);
  }

  @Query(() => BarangKeluarPage)
  barangKeluarList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.listKeluar(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => BarangKeluar, { nullable: true })
  barangKeluarById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byIdKeluar(id);
  }

  @Mutation(() => BarangKeluar)
  createBarangKeluar(@Args("input") input: BarangKeluarInput) {
    return this.service.createKeluar(input);
  }

  @Mutation(() => BarangKeluar, { nullable: true })
  updateBarangKeluar(@Args("id", { type: () => Int }) id: number, @Args("input") input: BarangKeluarInput) {
    return this.service.updateKeluar(id, input);
  }

  @Mutation(() => Boolean)
  deleteBarangKeluar(@Args("id", { type: () => Int }) id: number) {
    return this.service.deleteKeluar(id);
  }

  @Query(() => KartuStockPage)
  kartuStockList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.kartuStockList(limit ?? 100, offset ?? 0, q);
  }

  @Query(() => BarangExpiredPage)
  barangExpiredList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.barangExpiredList(limit ?? 100, offset ?? 0, q);
  }
}
