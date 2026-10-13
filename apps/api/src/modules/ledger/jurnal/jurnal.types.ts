import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class JurnalLine {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) debet?: boolean;
  @Field({ nullable: true }) note?: string;
  @Field({ nullable: true }) date?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
}

@InputType()
export class JurnalLineInput {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) debet?: boolean;
  @Field({ nullable: true }) note?: string;
  @Field({ nullable: true }) date?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
}

@ObjectType()
export class Jurnal {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field(() => Int, { nullable: true }) jenis?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) totalDebet?: string;
  @Field({ nullable: true }) totalKredit?: string;
  @Field(() => [JurnalLine], { nullable: true }) lines?: JurnalLine[];
}

@InputType()
export class JurnalInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field(() => Int, { nullable: true }) jenis?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [JurnalLineInput]) lines: JurnalLineInput[];
}

@ObjectType()
export class JurnalPage {
  @Field(() => [Jurnal]) rows: Jurnal[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class BukuBesar {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) debet?: string;
  @Field({ nullable: true }) kredit?: string;
  @Field({ nullable: true }) saldo?: string;
}

@ObjectType()
export class BukuBesarPage {
  @Field(() => [BukuBesar]) rows: BukuBesar[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class BukuBesarMutasiRow {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) noTrans?: string;
  @Field(() => Int, { nullable: true }) mu?: number;
  @Field({ nullable: true }) debet?: string;
  @Field({ nullable: true }) kredit?: string;
  @Field({ nullable: true }) saldo?: string;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) debetIdr?: string;
  @Field({ nullable: true }) kreditIdr?: string;
  @Field({ nullable: true }) saldoIdr?: string;
  @Field({ nullable: true }) note?: string;
  @Field({ nullable: true }) date?: string;
  @Field({ nullable: true }) vendorNama?: string;
  @Field({ nullable: true }) pelangganNama?: string;
  @Field(() => Int, { nullable: true }) jenis?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
}

@ObjectType()
export class BukuBesarMutasi {
  @Field({ nullable: true }) akunNama?: string;
  @Field({ nullable: true }) akunKode?: string;
  @Field({ nullable: true }) saldoAwal?: string;
  @Field({ nullable: true }) totDebet?: string;
  @Field({ nullable: true }) totKredit?: string;
  @Field({ nullable: true }) saldoAkhir?: string;
  @Field({ nullable: true }) saldoTarikKurs?: string;
  @Field(() => [BukuBesarMutasiRow]) rows: BukuBesarMutasiRow[];
}
