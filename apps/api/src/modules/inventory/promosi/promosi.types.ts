import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Promosi {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal1?: string;
  @Field({ nullable: true }) tanggal2?: string;
  @Field(() => Int, { nullable: true }) pukul1?: number;
  @Field(() => Int, { nullable: true }) pukul2?: number;
  @Field({ nullable: true }) hari?: string;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) penjCsh?: boolean;
  @Field({ nullable: true }) penjCrd?: boolean;
  @Field({ nullable: true }) semuaKomp?: boolean;
  @Field({ nullable: true }) divisi?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PromosiInput {
  @Field({ nullable: true }) tanggal1?: string;
  @Field({ nullable: true }) tanggal2?: string;
  @Field(() => Int, { nullable: true }) pukul1?: number;
  @Field(() => Int, { nullable: true }) pukul2?: number;
  @Field({ nullable: true }) hari?: string;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) penjCsh?: boolean;
  @Field({ nullable: true }) penjCrd?: boolean;
  @Field({ nullable: true }) semuaKomp?: boolean;
  @Field({ nullable: true }) divisi?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PromosiPage {
  @Field(() => [Promosi]) rows: Promosi[];
  @Field(() => Int) total: number;
}
