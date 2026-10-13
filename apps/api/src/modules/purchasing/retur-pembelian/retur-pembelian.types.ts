import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ReturLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class ReturLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class ReturPembelian {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [ReturLine], { nullable: true }) lines?: ReturLine[];
}

@InputType()
export class ReturPembelianInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) vendorId: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) pembelId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [ReturLineInput]) lines: ReturLineInput[];
}

@ObjectType()
export class ReturPembelianPage {
  @Field(() => [ReturPembelian]) rows: ReturPembelian[];
  @Field(() => Int) total: number;
}
