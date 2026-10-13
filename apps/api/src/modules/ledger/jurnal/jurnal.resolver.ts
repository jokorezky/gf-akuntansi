import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { JurnalService } from "./jurnal.service";
import { Jurnal, JurnalInput, JurnalPage, BukuBesarPage } from "./jurnal.types";

@Resolver(() => Jurnal)
export class JurnalResolver {
  constructor(private readonly service: JurnalService) {}

  @Query(() => JurnalPage)
  jurnalList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Jurnal, { nullable: true })
  jurnalById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => BukuBesarPage)
  bukuBesarList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.bukuBesarList(limit ?? 100, offset ?? 0, q);
  }

  @Mutation(() => Jurnal)
  createJurnal(@Args("input") input: JurnalInput) {
    return this.service.create(input);
  }

  @Mutation(() => Jurnal, { nullable: true })
  updateJurnal(@Args("id", { type: () => Int }) id: number, @Args("input") input: JurnalInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteJurnal(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
