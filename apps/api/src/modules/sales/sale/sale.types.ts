import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SaleLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field(() => Int, { nullable: true }) satuanId?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) bonus?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) expired?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class SaleLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) bonus?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) expired?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class Sale {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) salordId?: number;
  @Field({ nullable: true }) po?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field({ nullable: true }) salesKom?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) totRetur?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) adj01?: string;
  @Field({ nullable: true }) adj02?: string;
  @Field({ nullable: true }) adj03?: string;
  @Field({ nullable: true }) adj04?: string;
  @Field({ nullable: true }) adj05?: string;
  @Field({ nullable: true }) deposit?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field(() => Int, { nullable: true }) noPjk?: number;
  @Field(() => Int, { nullable: true }) noPjkSr?: number;
  @Field({ nullable: true }) tglPajak?: string;
  @Field({ nullable: true }) kursPajak?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [SaleLine], { nullable: true }) lines?: SaleLine[];
}

@InputType()
export class SaleInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) pelangId: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) salordId?: number;
  @Field({ nullable: true }) po?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field({ nullable: true }) salesKom?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) adj01?: string;
  @Field({ nullable: true }) adj02?: string;
  @Field({ nullable: true }) adj03?: string;
  @Field({ nullable: true }) adj04?: string;
  @Field({ nullable: true }) adj05?: string;
  @Field({ nullable: true }) deposit?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) lunas?: string;
  @Field(() => Int, { nullable: true }) noPjk?: number;
  @Field(() => Int, { nullable: true }) noPjkSr?: number;
  @Field({ nullable: true }) tglPajak?: string;
  @Field({ nullable: true }) kursPajak?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [SaleLineInput]) lines: SaleLineInput[];
}

@ObjectType()
export class SalePage {
  @Field(() => [Sale]) rows: Sale[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class KartuPiutang {
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) jenis?: string;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) nilai?: string;
}

@ObjectType()
export class KartuPiutangPage {
  @Field(() => [KartuPiutang]) rows: KartuPiutang[];
  @Field(() => Int) total: number;
}
