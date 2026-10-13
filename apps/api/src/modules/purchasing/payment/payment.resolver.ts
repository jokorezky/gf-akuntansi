import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PaymentService } from "./payment.service";
import { Payment, PaymentInput, PaymentPage, DaftarHutangPage } from "./payment.types";

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly service: PaymentService) {}

  @Query(() => PaymentPage)
  paymentList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Payment, { nullable: true })
  paymentById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Query(() => DaftarHutangPage)
  daftarHutangList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.daftarHutangList(limit ?? 100, offset ?? 0, q);
  }

  @Mutation(() => Payment)
  createPayment(@Args("input") input: PaymentInput) {
    return this.service.create(input);
  }

  @Mutation(() => Payment, { nullable: true })
  updatePayment(@Args("id", { type: () => Int }) id: number, @Args("input") input: PaymentInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deletePayment(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
