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
