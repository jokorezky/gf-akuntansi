import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { DepositPembelianService } from "./deposit-pembelian.service";
import { DepositPembelian, DepositPembelianInput, DepositPembelianPage } from "./deposit-pembelian.types";

@Resolver(() => DepositPembelian)
export class DepositPembelianResolver {
  constructor(private readonly service: DepositPembelianService) {}

  @Query(() => DepositPembelianPage)
  depositPembelianList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => DepositPembelian, { nullable: true })
  depositPembelianById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => DepositPembelian)
  createDepositPembelian(@Args("input") input: DepositPembelianInput) {
    return this.service.create(input);
  }

  @Mutation(() => DepositPembelian, { nullable: true })
  updateDepositPembelian(@Args("id", { type: () => Int }) id: number, @Args("input") input: DepositPembelianInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteDepositPembelian(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
