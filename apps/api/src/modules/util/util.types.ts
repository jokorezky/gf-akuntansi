import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DbInfoRow {
  @Field() tabel!: string;
  @Field() keterangan!: string;
  @Field() nilai!: string;
}

@ObjectType()
export class LookupResult {
  @Field() kode!: string;
  @Field() judul!: string;
  @Field(() => [String]) kolom!: string[];
  @Field(() => [[String]]) baris!: string[][];
}
