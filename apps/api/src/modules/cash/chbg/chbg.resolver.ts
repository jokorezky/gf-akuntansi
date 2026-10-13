import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ChbgService } from "./chbg.service";
import { ChbgPage, ChbgRef } from "./chbg.types";

@Resolver()
export class ChbgResolver {
  constructor(private readonly service: ChbgService) {}

  @Query(() => ChbgPage)
  chbgList(
    @Args("tipe") tipe: string,
    @Args("dari", { nullable: true }) dari?: string,
    @Args("sampai", { nullable: true }) sampai?: string,
    @Args("q", { nullable: true }) q?: string,
    @Args("status", { nullable: true }) status?: string,
    @Args("vendorId", { type: () => Int, nullable: true }) vendorId?: number,
    @Args("pelangId", { type: () => Int, nullable: true }) pelangId?: number,
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
  ) {
    return this.service.list(tipe, dari, sampai, q, status, vendorId, pelangId, limit ?? 300, offset ?? 0);
  }

  @Query(() => [ChbgRef])
  chbgVendorRef(@Args("q", { nullable: true }) q?: string) {
    return this.service.vendorRef(q);
  }

  @Query(() => [ChbgRef])
  chbgPelangganRef(@Args("q", { nullable: true }) q?: string) {
    return this.service.pelangganRef(q);
  }

  @Mutation(() => Int)
  chbgCairkan(
    @Args("tipe") tipe: string,
    @Args("ids", { type: () => [Int] }) ids: number[],
    @Args("tgl", { nullable: true }) tgl?: string,
    @Args("catatan", { nullable: true }) catatan?: string,
  ) {
    return this.service.cairkan(tipe, ids, tgl, catatan);
  }

  @Mutation(() => Int)
  chbgBatalCair(@Args("tipe") tipe: string, @Args("ids", { type: () => [Int] }) ids: number[]) {
    return this.service.batalCair(tipe, ids);
  }
}
