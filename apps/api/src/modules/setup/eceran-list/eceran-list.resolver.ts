import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { EceranListService } from "./eceran-list.service";
import { EceranList, EceranListInput, EceranListPage } from "./eceran-list.types";

@Resolver(() => EceranList)
export class EceranListResolver {
  constructor(private readonly service: EceranListService) {}

  @Query(() => EceranListPage)
  eceranListList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 100, offset ?? 0, q);
  }

  @Query(() => EceranList, { nullable: true })
  eceranListById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => EceranList)
  createEceranList(@Args("input") input: EceranListInput) {
    return this.service.create(input);
  }

  @Mutation(() => EceranList, { nullable: true })
  updateEceranList(@Args("id", { type: () => Int }) id: number, @Args("input") input: EceranListInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteEceranList(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
