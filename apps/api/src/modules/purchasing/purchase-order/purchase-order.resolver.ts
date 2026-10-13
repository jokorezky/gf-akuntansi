import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PurchaseOrderService } from "./purchase-order.service";
import { PurchaseOrder, PurchaseOrderInput, PurchaseOrderPage } from "./purchase-order.types";

@Resolver(() => PurchaseOrder)
export class PurchaseOrderResolver {
  constructor(private readonly service: PurchaseOrderService) {}

  @Query(() => PurchaseOrderPage)
  purchaseOrderList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => PurchaseOrder, { nullable: true })
  purchaseOrderById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => PurchaseOrder)
  createPurchaseOrder(@Args("input") input: PurchaseOrderInput) {
    return this.service.create(input);
  }

  @Mutation(() => PurchaseOrder, { nullable: true })
  updatePurchaseOrder(@Args("id", { type: () => Int }) id: number, @Args("input") input: PurchaseOrderInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePurchaseOrder(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
