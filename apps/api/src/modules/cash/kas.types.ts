import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class KasLine {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) kredit?: boolean;
}

@InputType()
export class KasLineInput {
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) kredit?: boolean;
}

@ObjectType()
export class KasMasuk {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field(() => [KasLine], { nullable: true }) lines?: KasLine[];
}

@InputType()
export class KasMasukInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
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
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) total?: string;
  @Field(() => [KasLine], { nullable: true }) lines?: KasLine[];
}

@InputType()
export class KasKeluarInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
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
