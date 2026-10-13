import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Perkiraan {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) header?: boolean;
  @Field(() => Int, { nullable: true }) golongan?: number;
  @Field({ nullable: true }) golonganNama?: string;
  @Field({ nullable: true }) debet?: boolean;
  @Field({ nullable: true }) multiCur?: boolean;
  @Field({ nullable: true }) tarikKurs?: boolean;
  @Field({ nullable: true }) nonRev?: boolean;
  @Field({ nullable: true }) salAwal?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) mauangKode?: string;
  @Field(() => Int, { nullable: true }) cairchbg?: number;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) securityInfo?: string;
}

@InputType()
export class PerkiraanInput {
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) header?: boolean;
  @Field(() => Int, { nullable: true }) golongan?: number;
  @Field({ nullable: true }) debet?: boolean;
  @Field({ nullable: true }) multiCur?: boolean;
  @Field({ nullable: true }) tarikKurs?: boolean;
  @Field({ nullable: true }) nonRev?: boolean;
  @Field({ nullable: true }) salAwal?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field(() => Int, { nullable: true }) cairchbg?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PerkiraanPage {
  @Field(() => [Perkiraan]) rows: Perkiraan[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class MauangRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) mataUang?: string;
}
