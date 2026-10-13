import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ProduksiService } from "./produksi.service";
import { PrditmRef, Produksi, ProduksiInput, ProduksiPage } from "./produksi.types";

@Resolver(() => Produksi)
export class ProduksiResolver {
  constructor(private readonly service: ProduksiService) {}

  @Query(() => ProduksiPage)
  produksiList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Produksi, { nullable: true })
  produksiById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => [PrditmRef])
  prditmRefList() {
    return this.service.prditmRef();
  }

  @Mutation(() => Produksi)
  createProduksi(@Args("input") input: ProduksiInput) {
    return this.service.create(input);
  }

  @Mutation(() => Produksi, { nullable: true })
  updateProduksi(@Args("id", { type: () => Int }) id: number, @Args("input") input: ProduksiInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteProduksi(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
