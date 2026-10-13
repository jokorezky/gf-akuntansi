import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AktivaTetapService } from "./aktiva-tetap.service";
import { AktivaTetap, AktivaTetapInput, AktivaTetapPage } from "./aktiva-tetap.types";

@Resolver(() => AktivaTetap)
export class AktivaTetapResolver {
  constructor(private readonly service: AktivaTetapService) {}

  @Query(() => AktivaTetapPage)
  aktivaTetapList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => AktivaTetap, { nullable: true })
  aktivaTetapById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => AktivaTetap)
  createAktivaTetap(@Args("input") input: AktivaTetapInput) {
    return this.service.create(input);
  }

  @Mutation(() => AktivaTetap, { nullable: true })
  updateAktivaTetap(@Args("id", { type: () => Int }) id: number, @Args("input") input: AktivaTetapInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteAktivaTetap(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
