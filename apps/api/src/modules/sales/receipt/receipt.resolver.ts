import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { ReceiptService } from "./receipt.service";
import { DaftarPiutangPage, Receipt, ReceiptInput, ReceiptPage } from "./receipt.types";

@Resolver(() => Receipt)
export class ReceiptResolver {
  constructor(private readonly service: ReceiptService) {}

  @Query(() => ReceiptPage)
  receiptList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Receipt, { nullable: true })
  receiptById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => DaftarPiutangPage)
  daftarPiutangList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.daftarPiutangList(limit ?? 100, offset ?? 0, q);
  }

  @Mutation(() => Receipt)
  createReceipt(@Args("input") input: ReceiptInput) {
    return this.service.create(input);
  }

  @Mutation(() => Receipt, { nullable: true })
  updateReceipt(@Args("id", { type: () => Int }) id: number, @Args("input") input: ReceiptInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteReceipt(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
