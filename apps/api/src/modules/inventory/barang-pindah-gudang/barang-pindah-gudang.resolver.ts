import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BarangPindahGudangService } from "./barang-pindah-gudang.service";
import { BarangPindahGudang, BarangPindahGudangInput, BarangPindahGudangPage } from "./barang-pindah-gudang.types";

@Resolver(() => BarangPindahGudang)
export class BarangPindahGudangResolver {
  constructor(private readonly service: BarangPindahGudangService) {}

  @Query(() => BarangPindahGudangPage)
  barangPindahGudangList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => BarangPindahGudang, { nullable: true })
  barangPindahGudangById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => BarangPindahGudang)
  createBarangPindahGudang(@Args("input") input: BarangPindahGudangInput) {
    return this.service.create(input);
  }

  @Mutation(() => BarangPindahGudang, { nullable: true })
  updateBarangPindahGudang(@Args("id", { type: () => Int }) id: number, @Args("input") input: BarangPindahGudangInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteBarangPindahGudang(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
