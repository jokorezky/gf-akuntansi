import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PindahLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field(() => Int, { nullable: true }) stockGdg?: number;
  @Field(() => Int, { nullable: true }) stockGdg2?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PindahLineInput {
  @Field(() => Int) stockId: number;
  @Field(() => Int, { nullable: true }) stockGdg?: number;
  @Field(() => Int, { nullable: true }) stockGdg2?: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) hpp?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class BarangPindahGudang {
  @Field(() => Int) id: number;
  @Field(() => Int, { nullable: true }) no?: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field(() => Int, { nullable: true }) gudang1?: number;
  @Field(() => Int, { nullable: true }) gudang2?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) totJumlah?: string;
  @Field(() => [PindahLine], { nullable: true }) lines?: PindahLine[];
}

@InputType()
export class BarangPindahGudangInput {
  @Field(() => Int, { nullable: true }) no?: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field(() => Int, { nullable: true }) gudang1?: number;
  @Field(() => Int, { nullable: true }) gudang2?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PindahLineInput]) lines: PindahLineInput[];
}

@ObjectType()
export class BarangPindahGudangPage {
  @Field(() => [BarangPindahGudang]) rows: BarangPindahGudang[];
  @Field(() => Int) total: number;
}
