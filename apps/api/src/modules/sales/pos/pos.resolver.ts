import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PosService } from "./pos.service";
import { Pos, PosInput, PosPage } from "./pos.types";

@Resolver(() => Pos)
export class PosResolver {
  constructor(private readonly service: PosService) {}

  @Query(() => PosPage)
  posList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Pos, { nullable: true })
  posById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Pos)
  createPos(@Args("input") input: PosInput) {
    return this.service.create(input);
  }

  @Mutation(() => Pos, { nullable: true })
  updatePos(@Args("id", { type: () => Int }) id: number, @Args("input") input: PosInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePos(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
