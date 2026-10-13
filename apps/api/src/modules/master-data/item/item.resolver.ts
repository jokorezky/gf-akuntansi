import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ItemService } from "./item.service";
import { Item, ItemInput, ItemPage, SisaStockPage } from "./item.types";

@Resolver(() => Item)
export class ItemResolver {
  constructor(private readonly service: ItemService) {}

  @Query(() => ItemPage)
  itemList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Item, { nullable: true })
  itemById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => SisaStockPage)
  sisaStockList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.sisaStockList(limit ?? 50, offset ?? 0, q);
  }

  @Mutation(() => Item)
  createItem(@Args("input") input: ItemInput) {
    return this.service.create(input);
  }

  @Mutation(() => Item, { nullable: true })
  updateItem(@Args("id", { type: () => Int }) id: number, @Args("input") input: ItemInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteItem(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
