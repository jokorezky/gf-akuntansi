import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PerkiraanService } from "./perkiraan.service";
import { MauangRef, Perkiraan, PerkiraanInput, PerkiraanPage } from "./perkiraan.types";

@Resolver(() => Perkiraan)
export class PerkiraanResolver {
  constructor(private readonly service: PerkiraanService) {}

  @Query(() => PerkiraanPage)
  perkiraanList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
    @Args("golongan", { type: () => Int, nullable: true }) golongan?: number,
  ) {
    return this.service.list(limit ?? 500, offset ?? 0, q, golongan);
  }

  @Query(() => Perkiraan, { nullable: true })
  perkiraanById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => [MauangRef])
  mauangList() {
    return this.service.mauangList();
  }

  @Mutation(() => Perkiraan)
  createPerkiraan(@Args("input") input: PerkiraanInput) {
    return this.service.create(input);
  }

  @Mutation(() => Perkiraan, { nullable: true })
  updatePerkiraan(@Args("id", { type: () => Int }) id: number, @Args("input") input: PerkiraanInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePerkiraan(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
