import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ReceiptLine {
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field({ nullable: true }) penjuaNo?: string;
  @Field({ nullable: true }) penjuaTanggal?: string;
  @Field({ nullable: true }) penjuaTotal?: string;
  @Field(() => Int, { nullable: true }) invpenId?: number;
  @Field(() => Int, { nullable: true }) retpenId?: number;
  @Field({ nullable: true }) retpenNo?: string;
  @Field(() => Int, { nullable: true }) dcnpiuId?: number;
  @Field(() => Int, { nullable: true }) deppenId?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field({ nullable: true }) discount?: string;
  @Field({ nullable: true }) denda?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class ReceiptLineInput {
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field(() => Int, { nullable: true }) invpenId?: number;
  @Field(() => Int, { nullable: true }) retpenId?: number;
  @Field(() => Int, { nullable: true }) dcnpiuId?: number;
  @Field(() => Int, { nullable: true }) deppenId?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field({ nullable: true }) discount?: string;
  @Field({ nullable: true }) denda?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class Receipt {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) collector?: number;
  @Field({ nullable: true }) alsBatal?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) totalLunas?: string;
  @Field({ nullable: true }) totalDisc?: string;
  @Field({ nullable: true }) totalDenda?: string;
  @Field(() => [ReceiptLine], { nullable: true }) lines?: ReceiptLine[];
}

@InputType()
export class ReceiptInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) pelangId: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) collector?: number;
  @Field({ nullable: true }) alsBatal?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [ReceiptLineInput]) lines: ReceiptLineInput[];
}

@ObjectType()
export class ReceiptPage {
  @Field(() => [Receipt]) rows: Receipt[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class DaftarPiutang {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) dibayar?: string;
  @Field({ nullable: true }) retur?: string;
  @Field({ nullable: true }) sisa?: string;
}

@ObjectType()
export class DaftarPiutangPage {
  @Field(() => [DaftarPiutang]) rows: DaftarPiutang[];
  @Field(() => Int) total: number;
}
