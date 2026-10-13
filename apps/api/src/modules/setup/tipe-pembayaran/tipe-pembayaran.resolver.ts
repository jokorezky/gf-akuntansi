import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { TipePembayaranService } from "./tipe-pembayaran.service";
import { TipePembayaran, TipePembayaranInput, TipePembayaranPage } from "./tipe-pembayaran.types";

@Resolver(() => TipePembayaran)
export class TipePembayaranResolver {
  constructor(private readonly service: TipePembayaranService) {}

  @Query(() => TipePembayaranPage)
  tipePembayaranList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 100, offset ?? 0, q);
  }

  @Query(() => TipePembayaran, { nullable: true })
  tipePembayaranById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => TipePembayaran)
  createTipePembayaran(@Args("input") input: TipePembayaranInput) {
    return this.service.create(input);
  }

  @Mutation(() => TipePembayaran, { nullable: true })
  updateTipePembayaran(@Args("id", { type: () => Int }) id: number, @Args("input") input: TipePembayaranInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteTipePembayaran(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
