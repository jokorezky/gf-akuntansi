import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ReturPenjualanService } from "./retur-penjualan.service";
import { ReturPenjualan, ReturPenjualanInput, ReturPenjualanPage } from "./retur-penjualan.types";

@Resolver(() => ReturPenjualan)
export class ReturPenjualanResolver {
  constructor(private readonly service: ReturPenjualanService) {}

  @Query(() => ReturPenjualanPage)
  returPenjualanList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => ReturPenjualan, { nullable: true })
  returPenjualanById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => ReturPenjualan)
  createReturPenjualan(@Args("input") input: ReturPenjualanInput) {
    return this.service.create(input);
  }

  @Mutation(() => ReturPenjualan, { nullable: true })
  updateReturPenjualan(@Args("id", { type: () => Int }) id: number, @Args("input") input: ReturPenjualanInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteReturPenjualan(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
