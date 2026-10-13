import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Produksi {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) prditmId?: number;
  @Field({ nullable: true }) prditmNama?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field(() => Int, { nullable: true }) perkir3?: number;
  @Field({ nullable: true }) nilai1?: string;
  @Field({ nullable: true }) nilai2?: string;
  @Field({ nullable: true }) nilai3?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
}

@InputType()
export class ProduksiInput {
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) prditmId?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field(() => Int, { nullable: true }) perkir3?: number;
  @Field({ nullable: true }) nilai1?: string;
  @Field({ nullable: true }) nilai2?: string;
  @Field({ nullable: true }) nilai3?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
}

@ObjectType()
export class ProduksiPage {
  @Field(() => [Produksi]) rows: Produksi[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class PrditmRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
  @Field(() => Int, { nullable: true }) stockId?: number;
  @Field({ nullable: true }) jumlah?: string;
}
