import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class TipePembayaran {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tipe?: string;
  @Field({ nullable: true }) hide?: boolean;
  @Field({ nullable: true }) gfpayment?: boolean;
  @Field({ nullable: true }) showQris?: boolean;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field({ nullable: true }) chargestxt?: string;
  @Field({ nullable: true }) charges?: string;
  @Field({ nullable: true }) chargesnil?: string;
  @Field({ nullable: true }) chargescd1?: string;
  @Field({ nullable: true }) chargescd2?: string;
  @Field({ nullable: true }) chargesitm?: boolean;
  @Field({ nullable: true }) noRound?: boolean;
  @Field({ nullable: true }) adjust?: string;
  @Field({ nullable: true }) glbDiscs?: boolean;
  @Field({ nullable: true }) glbDisc?: string;
  @Field({ nullable: true }) glbDiscnl?: string;
  @Field({ nullable: true }) glbDisccd?: string;
  @Field({ nullable: true }) cost?: string;
  @Field(() => Int, { nullable: true }) perkirId2?: number;
}

@InputType()
export class TipePembayaranInput {
  @Field({ nullable: true }) tipe?: string;
  @Field({ nullable: true }) hide?: boolean;
  @Field({ nullable: true }) gfpayment?: boolean;
  @Field({ nullable: true }) showQris?: boolean;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) chargestxt?: string;
  @Field({ nullable: true }) charges?: string;
  @Field({ nullable: true }) chargesnil?: string;
  @Field({ nullable: true }) chargescd1?: string;
  @Field({ nullable: true }) chargescd2?: string;
  @Field({ nullable: true }) chargesitm?: boolean;
  @Field({ nullable: true }) noRound?: boolean;
  @Field({ nullable: true }) adjust?: string;
  @Field({ nullable: true }) glbDiscs?: boolean;
  @Field({ nullable: true }) glbDisc?: string;
  @Field({ nullable: true }) glbDiscnl?: string;
  @Field({ nullable: true }) glbDisccd?: string;
  @Field({ nullable: true }) cost?: string;
  @Field(() => Int, { nullable: true }) perkirId2?: number;
}

@ObjectType()
export class TipePembayaranPage {
  @Field(() => [TipePembayaran]) rows: TipePembayaran[];
  @Field(() => Int) total: number;
}
