import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class KasLine {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) kredit?: boolean;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) note?: string;
  @Field({ nullable: true }) date?: string;
  @Field({ nullable: true }) cairchbg?: boolean;
}

@InputType()
export class KasLineInput {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) kredit?: boolean;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) kurs?: string;
  @Field({ nullable: true }) note?: string;
  @Field({ nullable: true }) date?: string;
  @Field({ nullable: true }) cairchbg?: boolean;
}

@ObjectType()
export class KasMasuk {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) terimaDari?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) total3?: string;
  @Field(() => [KasLine], { nullable: true }) lines?: KasLine[];
}

@InputType()
export class KasMasukInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) terimaDari?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [KasLineInput]) lines: KasLineInput[];
}

@ObjectType()
export class KasMasukPage {
  @Field(() => [KasMasuk]) rows: KasMasuk[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class KasKeluar {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) terimaDari?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) total3?: string;
  @Field(() => [KasLine], { nullable: true }) lines?: KasLine[];
}

@InputType()
export class KasKeluarInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) terimaDari?: string;
  @Field(() => Int, { nullable: true }) perkir1?: number;
  @Field(() => Int, { nullable: true }) perkir2?: number;
  @Field({ nullable: true }) penjEcr?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [KasLineInput]) lines: KasLineInput[];
}

@ObjectType()
export class KasKeluarPage {
  @Field(() => [KasKeluar]) rows: KasKeluar[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class PerkiraanRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}
