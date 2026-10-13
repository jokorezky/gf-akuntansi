import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PoLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) satuanC?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PoLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) discNilai?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) discPers2?: string;
  @Field({ nullable: true }) discPers3?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PurchaseOrder {
  @Field(() => Int) id: number;
  @Field(() => Int, { nullable: true }) no?: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) tglKirim?: string;
  @Field({ nullable: true }) tglTutup?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) jenpemId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) termBayar?: string;
  @Field({ nullable: true }) prtTJml?: boolean;
  @Field({ nullable: true }) prtHarga?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PoLine], { nullable: true }) lines?: PoLine[];
}

@InputType()
export class PurchaseOrderInput {
  @Field(() => Int, { nullable: true }) no?: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) tglKirim?: string;
  @Field({ nullable: true }) tglTutup?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) jenpemId?: number;
  @Field(() => Int) vendorId: number;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) discNilai?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) termBayar?: string;
  @Field(() => Boolean, { nullable: true }) prtTJml?: boolean;
  @Field(() => Boolean, { nullable: true }) prtHarga?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PoLineInput]) lines: PoLineInput[];
}

@ObjectType()
export class PurchaseOrderPage {
  @Field(() => [PurchaseOrder]) rows: PurchaseOrder[];
  @Field(() => Int) total: number;
}
