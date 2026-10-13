import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { KasService } from "./kas.service";
import { KasKeluar, KasKeluarInput, KasKeluarPage, KasMasuk, KasMasukInput, KasMasukPage, PerkiraanRef } from "./kas.types";

@Resolver()
export class KasResolver {
  constructor(private readonly service: KasService) {}

  @Query(() => KasMasukPage)
  kasMasukList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.listMasuk(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => KasMasuk, { nullable: true })
  kasMasukById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byIdMasuk(id);
  }

  @Mutation(() => KasMasuk)
  createKasMasuk(@Args("input") input: KasMasukInput) {
    return this.service.createMasuk(input);
  }

  @Mutation(() => KasMasuk, { nullable: true })
  updateKasMasuk(@Args("id", { type: () => Int }) id: number, @Args("input") input: KasMasukInput) {
    return this.service.updateMasuk(id, input);
  }

  @Mutation(() => Boolean)
  deleteKasMasuk(@Args("id", { type: () => Int }) id: number) {
    return this.service.deleteMasuk(id);
  }

  @Query(() => KasKeluarPage)
  kasKeluarList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.listKeluar(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => KasKeluar, { nullable: true })
  kasKeluarById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byIdKeluar(id);
  }

  @Mutation(() => KasKeluar)
  createKasKeluar(@Args("input") input: KasKeluarInput) {
    return this.service.createKeluar(input);
  }

  @Mutation(() => KasKeluar, { nullable: true })
  updateKasKeluar(@Args("id", { type: () => Int }) id: number, @Args("input") input: KasKeluarInput) {
    return this.service.updateKeluar(id, input);
  }

  @Mutation(() => Boolean)
  deleteKasKeluar(@Args("id", { type: () => Int }) id: number) {
    return this.service.deleteKeluar(id);
  }

  @Query(() => [PerkiraanRef])
  perkiraanRefList() {
    return this.service.perkiraanRefList();
  }
}
