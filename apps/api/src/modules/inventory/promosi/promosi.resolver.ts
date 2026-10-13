import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PromosiService } from "./promosi.service";
import { Promosi, PromosiInput, PromosiPage } from "./promosi.types";

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
