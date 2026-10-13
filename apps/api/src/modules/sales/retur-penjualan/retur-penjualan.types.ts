import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ReturJualLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field(() => Int, { nullable: true }) stockGdg?: number;
  @Field({ nullable: true }) stockNon?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) satuanC?: string;
  @Field(() => Int, { nullable: true }) satRusak?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) jmlRusak?: string;
  @Field(() => Int, { nullable: true }) bonSatuan?: number;
  @Field({ nullable: true }) bonJumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) hargaEx1?: string;
  @Field({ nullable: true }) hargaEx2?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) mastDisc?: string;
  @Field({ nullable: true }) mastPpn?: string;
  @Field({ nullable: true }) mastAdj1?: string;
  @Field({ nullable: true }) mastAdj2?: string;
  @Field({ nullable: true }) mastAdj3?: string;
  @Field({ nullable: true }) mastAdj4?: string;
  @Field({ nullable: true }) mastAdj5?: string;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) hppRusak?: string;
  @Field({ nullable: true }) dariMast?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) nilai?: string;
}

@InputType()
export class ReturJualLineInput {
  @Field(() => Int) stockId: number;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field(() => Int, { nullable: true }) stockGdg?: number;
  @Field({ nullable: true }) stockNon?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) satuanC?: string;
  @Field(() => Int, { nullable: true }) satRusak?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) jmlRusak?: string;
  @Field(() => Int, { nullable: true }) bonSatuan?: number;
  @Field({ nullable: true }) bonJumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) hargaEx1?: string;
  @Field({ nullable: true }) hargaEx2?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) hppRusak?: string;
  @Field({ nullable: true }) dariMast?: boolean;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class ReturPenjualan {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field(() => Int, { nullable: true }) noInt?: number;
  @Field({ nullable: true }) noC?: string;
  @Field(() => Int, { nullable: true }) noPjk?: number;
  @Field({ nullable: true }) tglPajak?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) pelAlamat?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field({ nullable: true }) cash?: boolean;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) kursPajak?: string;
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field({ nullable: true }) penjuaNo?: string;
  @Field(() => Int, { nullable: true }) penjuaId2?: number;
  @Field({ nullable: true }) penjuaNo2?: string;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totHarex1?: string;
  @Field({ nullable: true }) totHarex2?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) discPerst?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) adj1?: string;
  @Field({ nullable: true }) adj2?: string;
  @Field({ nullable: true }) adj3?: string;
  @Field({ nullable: true }) adj4?: string;
  @Field({ nullable: true }) adj5?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field({ nullable: true }) alsBatal?: string;
  @Field({ nullable: true }) totalNilai?: string;
  @Field({ nullable: true }) totalRetur?: string;
  @Field(() => [ReturJualLine], { nullable: true }) lines?: ReturJualLine[];
}

@InputType()
export class ReturPenjualanInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) tglPajak?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelAlamat?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field({ nullable: true }) cash?: boolean;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) kursPajak?: string;
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field(() => Int, { nullable: true }) penjuaId2?: number;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) discPerst?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) adj1?: string;
  @Field({ nullable: true }) adj2?: string;
  @Field({ nullable: true }) adj3?: string;
  @Field({ nullable: true }) adj4?: string;
  @Field({ nullable: true }) adj5?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) catatan2?: string;
  @Field({ nullable: true }) catatan3?: string;
  @Field({ nullable: true }) alsBatal?: string;
  @Field(() => [ReturJualLineInput]) lines: ReturJualLineInput[];
}

@ObjectType()
export class ReturPenjualanPage {
  @Field(() => [ReturPenjualan]) rows: ReturPenjualan[];
  @Field(() => Int) total: number;
}
