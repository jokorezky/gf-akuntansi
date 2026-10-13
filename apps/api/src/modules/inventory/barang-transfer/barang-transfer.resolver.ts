import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { BarangTransferService } from "./barang-transfer.service";
import { BarangTransfer, BarangTransferInput, BarangTransferPage, SisaStockInfo } from "./barang-transfer.types";

@Resolver(() => BarangTransfer)
export class BarangTransferResolver {
  constructor(private readonly service: BarangTransferService) {}

  @Query(() => BarangTransferPage)
  barangTransferList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => BarangTransfer, { nullable: true })
  barangTransferById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => SisaStockInfo, { nullable: true })
  trfSisaStock(@Args("stockId", { type: () => Int }) stockId: number) {
    return this.service.sisaStock(stockId);
  }

  @Mutation(() => BarangTransfer)
  createBarangTransfer(@Args("input") input: BarangTransferInput) {
    return this.service.create(input);
  }

  @Mutation(() => BarangTransfer, { nullable: true })
  updateBarangTransfer(@Args("id", { type: () => Int }) id: number, @Args("input") input: BarangTransferInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteBarangTransfer(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
