import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PurchaseLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) expired?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PurchaseLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) expired?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class Purchase {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) totDisc?: string;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) ppnNilai?: string;
  @Field({ nullable: true }) deposit?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PurchaseLine], { nullable: true }) lines?: PurchaseLine[];
}

@InputType()
export class PurchaseInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int) vendorId: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field({ nullable: true }) deposit?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PurchaseLineInput]) lines: PurchaseLineInput[];
}

@ObjectType()
export class PurchasePage {
  @Field(() => [Purchase]) rows: Purchase[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class KartuHutang {
  @Field({ nullable: true }) vendorNama?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) jenis?: string;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) nilai?: string;
}

@ObjectType()
export class KartuHutangPage {
  @Field(() => [KartuHutang]) rows: KartuHutang[];
  @Field(() => Int) total: number;
}
