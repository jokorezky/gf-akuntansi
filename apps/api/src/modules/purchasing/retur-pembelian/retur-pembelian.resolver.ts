import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ReturPembelianService } from "./retur-pembelian.service";
import { ReturPembelian, ReturPembelianInput, ReturPembelianPage } from "./retur-pembelian.types";

@Resolver(() => ReturPembelian)
export class ReturPembelianResolver {
  constructor(private readonly service: ReturPembelianService) {}

  @Query(() => ReturPembelianPage)
  returPembelianList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => ReturPembelian, { nullable: true })
  returPembelianById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => ReturPembelian)
  createReturPembelian(@Args("input") input: ReturPembelianInput) {
    return this.service.create(input);
  }

  @Mutation(() => ReturPembelian, { nullable: true })
  updateReturPembelian(@Args("id", { type: () => Int }) id: number, @Args("input") input: ReturPembelianInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteReturPembelian(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
