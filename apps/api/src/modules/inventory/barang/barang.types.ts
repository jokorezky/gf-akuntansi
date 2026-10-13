import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BarangLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class BarangLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class BarangMasuk {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field(() => Int, { nullable: true }) grpsmkId?: number;
  @Field({ nullable: true }) grpsmkNama?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) totalQty?: string;
  @Field({ nullable: true }) totalHpp?: string;
  @Field(() => [BarangLine], { nullable: true }) lines?: BarangLine[];
}

@InputType()
export class BarangMasukInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field(() => Int, { nullable: true }) grpsmkId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [BarangLineInput]) lines: BarangLineInput[];
}

@ObjectType()
export class BarangMasukPage {
  @Field(() => [BarangMasuk]) rows: BarangMasuk[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class BarangKeluar {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field(() => Int, { nullable: true }) grpsmkId?: number;
  @Field({ nullable: true }) grpsmkNama?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) totalQty?: string;
  @Field({ nullable: true }) totalHpp?: string;
  @Field(() => [BarangLine], { nullable: true }) lines?: BarangLine[];
}

@InputType()
export class BarangKeluarInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field(() => Int, { nullable: true }) grpsmkId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [BarangLineInput]) lines: BarangLineInput[];
}

@ObjectType()
export class BarangKeluarPage {
  @Field(() => [BarangKeluar]) rows: BarangKeluar[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class GrpsmkRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) stkMasuk?: boolean;
  @Field({ nullable: true }) stkKeluar?: boolean;
}

@ObjectType()
export class KartuStock {
  @Field(() => Int, { nullable: true }) stockId?: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) jenis?: string;
  @Field({ nullable: true }) gudang?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class KartuStockPage {
  @Field(() => [KartuStock]) rows: KartuStock[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class BarangExpired {
  @Field(() => Int, { nullable: true }) stockId?: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) expired?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) gudang?: number;
}

@ObjectType()
export class BarangExpiredPage {
  @Field(() => [BarangExpired]) rows: BarangExpired[];
  @Field(() => Int) total: number;
}
