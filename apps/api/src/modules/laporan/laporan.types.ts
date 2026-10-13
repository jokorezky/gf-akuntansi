import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class LaporanItem {
  @Field() kode!: string;
  @Field() nama!: string;
  @Field() file!: string;
  @Field() kategori!: string;
  @Field({ nullable: true }) implemented?: boolean;
  @Field({ nullable: true }) na?: boolean;
}

@ObjectType()
export class LaporanGroup {
  @Field() label!: string;
  @Field(() => [LaporanItem]) items!: LaporanItem[];
}

@ObjectType()
export class LaporanCatalog {
  @Field(() => Int) total!: number;
  @Field(() => [LaporanGroup]) groups!: LaporanGroup[];
}

@ObjectType()
export class LaporanHasil {
  @Field() kode!: string;
  @Field() judul!: string;
  @Field(() => [String]) kolom!: string[];
  @Field(() => [[String]]) baris!: string[][];
  @Field(() => Int) total!: number;
  @Field({ nullable: true }) catatan?: string;
}
