import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class EceranList {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) list?: string;
  @Field(() => Int, { nullable: true }) type?: number;
  @Field(() => Int, { nullable: true }) kelompok?: number;
  @Field({ nullable: true }) kelompokNama?: string;
  @Field(() => Int, { nullable: true }) kelompok2?: number;
  @Field(() => Int, { nullable: true }) hitungan?: number;
  @Field(() => Int, { nullable: true }) hargaJual?: number;
  @Field(() => Int, { nullable: true }) itemId?: number;
  @Field({ nullable: true }) itemNama?: string;
  @Field(() => Int, { nullable: true }) itemExtraId?: number;
  @Field({ nullable: true }) harga1?: string;
  @Field({ nullable: true }) harga2?: string;
  @Field({ nullable: true }) harga3?: string;
  @Field({ nullable: true }) harga4?: string;
  @Field({ nullable: true }) harga5?: string;
  @Field({ nullable: true }) pabxExt?: string;
  @Field({ nullable: true }) keyRoom?: string;
  @Field({ nullable: true }) keyLift?: string;
  @Field({ nullable: true }) defOut?: string;
  @Field({ nullable: true }) hide?: boolean;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class EceranListInput {
  @Field({ nullable: true }) list?: string;
  @Field(() => Int, { nullable: true }) type?: number;
  @Field(() => Int, { nullable: true }) kelompok?: number;
  @Field(() => Int, { nullable: true }) kelompok2?: number;
  @Field(() => Int, { nullable: true }) hitungan?: number;
  @Field(() => Int, { nullable: true }) hargaJual?: number;
  @Field(() => Int, { nullable: true }) itemId?: number;
  @Field(() => Int, { nullable: true }) itemExtraId?: number;
  @Field({ nullable: true }) harga1?: string;
  @Field({ nullable: true }) harga2?: string;
  @Field({ nullable: true }) harga3?: string;
  @Field({ nullable: true }) harga4?: string;
  @Field({ nullable: true }) harga5?: string;
  @Field({ nullable: true }) pabxExt?: string;
  @Field({ nullable: true }) keyRoom?: string;
  @Field({ nullable: true }) keyLift?: string;
  @Field({ nullable: true }) defOut?: string;
  @Field({ nullable: true }) hide?: boolean;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class EceranListPage {
  @Field(() => [EceranList]) rows: EceranList[];
  @Field(() => Int) total: number;
}
