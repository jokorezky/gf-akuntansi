import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class TrfLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuanC?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class TrfLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class BarangTransfer {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pukul?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) nilai1?: string;
  @Field({ nullable: true }) nilai2?: string;
  @Field({ nullable: true }) nilai3?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field(() => Int, { nullable: true }) perkir3?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field({ nullable: true }) catatan4?: string;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totJumlah?: string;
  @Field(() => [TrfLine], { nullable: true }) lines?: TrfLine[];
}

@InputType()
export class BarangTransferInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pukul?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) nilai1?: string;
  @Field({ nullable: true }) nilai2?: string;
  @Field({ nullable: true }) nilai3?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field(() => Int, { nullable: true }) perkir3?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field({ nullable: true }) catatan4?: string;
  @Field(() => [TrfLineInput]) lines: TrfLineInput[];
}

@ObjectType()
export class BarangTransferPage {
  @Field(() => [BarangTransfer]) rows: BarangTransfer[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class SisaStockInfo {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) sisa?: string;
}
