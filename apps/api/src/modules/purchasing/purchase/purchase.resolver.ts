import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PurchaseService } from "./purchase.service";
import { Purchase, PurchaseInput, PurchasePage, KartuHutangPage } from "./purchase.types";

@Resolver(() => Purchase)
export class PurchaseResolver {
  constructor(private readonly service: PurchaseService) {}

  @Query(() => PurchasePage)
  purchaseList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Purchase, { nullable: true })
  purchaseById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Purchase)
  createPurchase(@Args("input") input: PurchaseInput) {
    return this.service.create(input);
  }

  @Mutation(() => Purchase, { nullable: true })
  updatePurchase(@Args("id", { type: () => Int }) id: number, @Args("input") input: PurchaseInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePurchase(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }

  @Query(() => KartuHutangPage)
  kartuHutangList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
    @Args("vendorId", { type: () => Int, nullable: true }) vendorId?: number,
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
  ) {
    return this.service.kartuHutangList(limit ?? 200, offset ?? 0, q, vendorId, dari, sampai);
  }
}
