import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Produksi {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) prditmId?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class ProduksiInput {
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) prditmId?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class ProduksiPage {
  @Field(() => [Produksi]) rows: Produksi[];
  @Field(() => Int) total: number;
}
