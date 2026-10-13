import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GlCekKursRow {
  @Field() tanggal!: string;
  @Field() no!: string;
  @Field() catatan!: string;
  @Field() mu!: string;
  @Field() debet!: string;
  @Field() kredit!: string;
  @Field() kurs!: string;
  @Field() debetIdr!: string;
  @Field() kreditIdr!: string;
}

@ObjectType()
export class GlCekKursPage {
  @Field(() => Int) total!: number;
  @Field(() => [GlCekKursRow]) rows!: GlCekKursRow[];
}

@ObjectType()
export class GlCekPerantaraRow {
  @Field() tanggal!: string;
  @Field() debet!: string;
  @Field() kredit!: string;
  @Field() selisih!: string;
}

@ObjectType()
export class GlCekPerantaraPage {
  @Field(() => Int) total!: number;
  @Field(() => [GlCekPerantaraRow]) rows!: GlCekPerantaraRow[];
}

@ObjectType()
export class GlSaldoAkhirRow {
  @Field(() => Int) no!: number;
  @Field() kode!: string;
  @Field() nama!: string;
  @Field() mu!: string;
  @Field() saldo!: string;
}

@ObjectType()
export class GlSaldoAkhirPage {
  @Field(() => Int) total!: number;
  @Field(() => [GlSaldoAkhirRow]) rows!: GlSaldoAkhirRow[];
}
