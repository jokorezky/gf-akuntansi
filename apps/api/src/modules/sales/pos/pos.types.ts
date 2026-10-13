import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PosLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PosLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) discPers?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class Pos {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelNama?: string;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field({ nullable: true }) total?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PosLine], { nullable: true }) lines?: PosLine[];
}

@InputType()
export class PosInput {
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field(() => Int, { nullable: true }) gudang?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PosLineInput]) lines: PosLineInput[];
}

@ObjectType()
export class PosPage {
  @Field(() => [Pos]) rows: Pos[];
  @Field(() => Int) total: number;
}
