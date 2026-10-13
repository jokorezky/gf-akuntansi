import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DepositPembelian {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) purcorId?: number;
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) deposit?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class DepositPembelianInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) vendorId: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) purcorId?: number;
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) deposit?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class DepositPembelianPage {
  @Field(() => [DepositPembelian]) rows: DepositPembelian[];
  @Field(() => Int) total: number;
}
