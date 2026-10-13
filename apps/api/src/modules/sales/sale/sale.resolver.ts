import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { SaleService } from "./sale.service";
import { Sale, SaleInput, SalePage, KartuPiutangPage } from "./sale.types";

@Resolver(() => Sale)
export class SaleResolver {
  constructor(private readonly service: SaleService) {}

  @Query(() => SalePage)
  saleList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Sale, { nullable: true })
  saleById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Sale)
  createSale(@Args("input") input: SaleInput) {
    return this.service.create(input);
  }

  @Mutation(() => Sale, { nullable: true })
  updateSale(@Args("id", { type: () => Int }) id: number, @Args("input") input: SaleInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteSale(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }

  @Query(() => KartuPiutangPage)
  kartuPiutangList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.kartuPiutangList(limit ?? 100, offset ?? 0, q);
  }
}
