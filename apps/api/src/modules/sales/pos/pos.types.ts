import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PosLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) satuanC?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) hargaEx1?: string;
  @Field({ nullable: true }) hargaEx2?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) alsBatal?: string;
}

@InputType()
export class PosLineInput {
  @Field(() => Int) stockId: number;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) satuanC?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) hargaEx1?: string;
  @Field({ nullable: true }) hargaEx2?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) alsBatal?: string;
}

@ObjectType()
export class Pos {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) pukulC?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) adj1Pers?: string;
  @Field({ nullable: true }) adj2Pers?: string;
  @Field({ nullable: true }) adj3Pers?: string;
  @Field({ nullable: true }) adj4Pers?: string;
  @Field({ nullable: true }) adj5Pers?: string;
  @Field({ nullable: true }) adj1Nilai?: string;
  @Field({ nullable: true }) adj2Nilai?: string;
  @Field({ nullable: true }) adj3Nilai?: string;
  @Field({ nullable: true }) adj4Nilai?: string;
  @Field({ nullable: true }) adj5Nilai?: string;
  @Field(() => Int, { nullable: true }) stsEcr?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field({ nullable: true }) subTotal?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) totalQty?: string;
  @Field({ nullable: true }) total?: string;
  @Field(() => [PosLine], { nullable: true }) lines?: PosLine[];
}

@InputType()
export class PosInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) adj1Pers?: string;
  @Field({ nullable: true }) adj2Pers?: string;
  @Field({ nullable: true }) adj3Pers?: string;
  @Field({ nullable: true }) adj4Pers?: string;
  @Field({ nullable: true }) adj5Pers?: string;
  @Field({ nullable: true }) adj1Nilai?: string;
  @Field({ nullable: true }) adj2Nilai?: string;
  @Field({ nullable: true }) adj3Nilai?: string;
  @Field({ nullable: true }) adj4Nilai?: string;
  @Field({ nullable: true }) adj5Nilai?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field(() => [PosLineInput]) lines: PosLineInput[];
}

@ObjectType()
export class PosPage {
  @Field(() => [Pos]) rows: Pos[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class PosKatalogItem {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
  @Field(() => Int, { nullable: true }) grup?: number;
  @Field({ nullable: true }) hargaJ1?: string;
  @Field({ nullable: true }) hargaJ2?: string;
  @Field({ nullable: true }) hargaJ3?: string;
  @Field({ nullable: true }) hargaJ4?: string;
  @Field({ nullable: true }) hargaJ5?: string;
  @Field({ nullable: true }) disc1J1?: string;
  @Field({ nullable: true }) disc2J1?: string;
  @Field({ nullable: true }) disc3J1?: string;
  @Field({ nullable: true }) disc1J2?: string;
  @Field({ nullable: true }) disc2J2?: string;
  @Field({ nullable: true }) disc3J2?: string;
  @Field({ nullable: true }) disc1J3?: string;
  @Field({ nullable: true }) disc2J3?: string;
  @Field({ nullable: true }) disc3J3?: string;
  @Field({ nullable: true }) disc1J4?: string;
  @Field({ nullable: true }) disc2J4?: string;
  @Field({ nullable: true }) disc3J4?: string;
  @Field({ nullable: true }) disc1J5?: string;
  @Field({ nullable: true }) disc2J5?: string;
  @Field({ nullable: true }) disc3J5?: string;
}

@ObjectType()
export class PosDivisiRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
}
