import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PelangganService } from "./pelanggan.service";
import { Pelanggan, PelangganInput, PelangganPage } from "./pelanggan.types";

@Resolver(() => Pelanggan)
export class PelangganResolver {
  constructor(private readonly service: PelangganService) {}

  @Query(() => PelangganPage)
  pelangganList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Pelanggan, { nullable: true })
  pelangganById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Pelanggan)
  createPelanggan(@Args("input") input: PelangganInput) {
    return this.service.create(input);
  }

  @Mutation(() => Pelanggan, { nullable: true })
  updatePelanggan(@Args("id", { type: () => Int }) id: number, @Args("input") input: PelangganInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePelanggan(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
