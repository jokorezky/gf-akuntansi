import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { SalesOrderService } from "./sales-order.service";
import { SalesOrder, SalesOrderInput, SalesOrderPage } from "./sales-order.types";

@Resolver(() => SalesOrder)
export class SalesOrderResolver {
  constructor(private readonly service: SalesOrderService) {}

  @Query(() => SalesOrderPage)
  salesOrderList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => SalesOrder, { nullable: true })
  salesOrderById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => SalesOrder)
  createSalesOrder(@Args("input") input: SalesOrderInput) {
    return this.service.create(input);
  }

  @Mutation(() => SalesOrder, { nullable: true })
  updateSalesOrder(@Args("id", { type: () => Int }) id: number, @Args("input") input: SalesOrderInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteSalesOrder(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
