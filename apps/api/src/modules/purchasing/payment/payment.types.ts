import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PayLine {
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field({ nullable: true }) discount?: string;
  @Field({ nullable: true }) denda?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PayLineInput {
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field({ nullable: true }) discount?: string;
  @Field({ nullable: true }) denda?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class Payment {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field(() => [PayLine], { nullable: true }) lines?: PayLine[];
}

@InputType()
export class PaymentInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) vendorId: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PayLineInput]) lines: PayLineInput[];
}

@ObjectType()
export class PaymentPage {
  @Field(() => [Payment]) rows: Payment[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class DaftarHutang {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) vendorNama?: string;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) dibayar?: string;
  @Field({ nullable: true }) retur?: string;
  @Field({ nullable: true }) sisa?: string;
}

@ObjectType()
export class DaftarHutangPage {
  @Field(() => [DaftarHutang]) rows: DaftarHutang[];
  @Field(() => Int) total: number;
}
