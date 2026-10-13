import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SoLine {
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
  @Field({ nullable: true }) toexRec?: boolean;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class SoLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) bonus?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class SalesOrder {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) tglKirim?: string;
  @Field({ nullable: true }) tglTutup?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) po?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field(() => Int, { nullable: true }) jenpemId?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field(() => Int, { nullable: true }) penjuaId?: number;
  @Field({ nullable: true }) penjuaNo?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [SoLine], { nullable: true }) lines?: SoLine[];
}

@InputType()
export class SalesOrderInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) tglKirim?: string;
  @Field({ nullable: true }) tglTutup?: string;
  @Field(() => Int) pelangId: number;
  @Field({ nullable: true }) po?: string;
  @Field(() => Int, { nullable: true }) salesId?: number;
  @Field(() => Int, { nullable: true }) jenpemId?: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [SoLineInput]) lines: SoLineInput[];
}

@ObjectType()
export class SalesOrderPage {
  @Field(() => [SalesOrder]) rows: SalesOrder[];
  @Field(() => Int) total: number;
}
