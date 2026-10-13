import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ReturJualLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class ReturJualLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class ReturPenjualan {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [ReturJualLine], { nullable: true }) lines?: ReturJualLine[];
}

@InputType()
export class ReturPenjualanInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) pelangId: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [ReturJualLineInput]) lines: ReturJualLineInput[];
}

@ObjectType()
export class ReturPenjualanPage {
  @Field(() => [ReturPenjualan]) rows: ReturPenjualan[];
  @Field(() => Int) total: number;
}
