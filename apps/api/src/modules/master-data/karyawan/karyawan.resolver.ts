import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { KaryawanService } from "./karyawan.service";
import { Karyawan, KaryawanInput, KaryawanPage } from "./karyawan.types";

@Resolver(() => Karyawan)
export class KaryawanResolver {
  constructor(private readonly service: KaryawanService) {}

  @Query(() => KaryawanPage)
  karyawanList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Karyawan, { nullable: true })
  karyawanById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Karyawan)
  createKaryawan(@Args("input") input: KaryawanInput) {
    return this.service.create(input);
  }

  @Mutation(() => Karyawan, { nullable: true })
  updateKaryawan(@Args("id", { type: () => Int }) id: number, @Args("input") input: KaryawanInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteKaryawan(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
