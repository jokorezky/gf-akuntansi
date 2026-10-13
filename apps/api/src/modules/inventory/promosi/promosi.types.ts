import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Promosi {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal1?: string;
  @Field({ nullable: true }) tanggal2?: string;
  @Field(() => Int, { nullable: true }) pukul1?: number;
  @Field(() => Int, { nullable: true }) pukul2?: number;
  @Field({ nullable: true }) hari?: string;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) penjCsh?: boolean;
  @Field({ nullable: true }) penjCrd?: boolean;
  @Field({ nullable: true }) semuaKomp?: boolean;
  @Field({ nullable: true }) divisi?: string;
  @Field({ nullable: true }) groupPel?: string;
  @Field({ nullable: true }) groupPe2?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PromosiInput {
  @Field({ nullable: true }) tanggal1?: string;
  @Field({ nullable: true }) tanggal2?: string;
  @Field(() => Int, { nullable: true }) pukul1?: number;
  @Field(() => Int, { nullable: true }) pukul2?: number;
  @Field({ nullable: true }) hari?: string;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) penjCsh?: boolean;
  @Field({ nullable: true }) penjCrd?: boolean;
  @Field({ nullable: true }) semuaKomp?: boolean;
  @Field({ nullable: true }) divisi?: string;
  @Field({ nullable: true }) groupPel?: string;
  @Field({ nullable: true }) groupPe2?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PromosiPage {
  @Field(() => [Promosi]) rows: Promosi[];
  @Field(() => Int) total: number;
}

@InputType()
export class PromoLevelIn {
  @Field(() => Int) level: number;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
}

@ObjectType()
export class PromoItemInfo {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) satuanC?: string;
  @Field({ nullable: true }) hargaBeli?: string;
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
export class PromoLevelRow {
  @Field(() => Int) sysId: number;
  @Field(() => Int, { nullable: true }) mauangId?: number;
  @Field({ nullable: true }) hargaDari?: string;
  @Field({ nullable: true }) hargaSd?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discNilai?: string;
}

@ObjectType()
export class GrpPelRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
}
