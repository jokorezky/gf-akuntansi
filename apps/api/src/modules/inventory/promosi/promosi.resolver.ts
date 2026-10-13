import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PromosiService } from "./promosi.service";
import { GrpPelRef, PromoItemInfo, PromoLevelIn, PromoLevelRow, Promosi, PromosiInput, PromosiPage } from "./promosi.types";

@Resolver(() => Promosi)
export class PromosiResolver {
  constructor(private readonly service: PromosiService) {}

  @Query(() => PromosiPage)
  promosiList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Promosi, { nullable: true })
  promosiById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => PromoItemInfo, { nullable: true })
  promoItemInfo(@Args("stockId", { type: () => Int }) stockId: number) {
    return this.service.itemInfo(stockId);
  }

  @Query(() => [PromoLevelRow])
  promoLevelList(@Args("promosId", { type: () => Int }) promosId: number) {
    return this.service.levelList(promosId);
  }

  @Query(() => [GrpPelRef])
  grppelRefList() {
    return this.service.grppelRef();
  }

  @Query(() => [GrpPelRef])
  grppe2RefList() {
    return this.service.grppe2Ref();
  }

  @Mutation(() => Boolean)
  promoTerapkanItem(
    @Args("promosId", { type: () => Int }) promosId: number,
    @Args("stockId", { type: () => Int }) stockId: number,
    @Args("mode") mode: string,
    @Args("levels", { type: () => [PromoLevelIn] }) levels: PromoLevelIn[],
  ) {
    return this.service.terapkanItem(promosId, stockId, mode, levels);
  }

  @Mutation(() => Promosi)
  createPromosi(@Args("input") input: PromosiInput) {
    return this.service.create(input);
  }

  @Mutation(() => Promosi, { nullable: true })
  updatePromosi(@Args("id", { type: () => Int }) id: number, @Args("input") input: PromosiInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePromosi(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
