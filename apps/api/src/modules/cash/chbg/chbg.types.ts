import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ChbgRow {
  @Field(() => Int) sysId: number;
  @Field({ nullable: true }) kasId?: number;
  @Field({ nullable: true }) dbCr?: string;
  @Field({ nullable: true }) no?: string;
  @Field({ nullable: true }) tanggal?: string;
  @Field({ nullable: true }) lunasDt?: string;
  @Field({ nullable: true }) lunasDoc?: string;
  @Field(() => Int, { nullable: true }) mauang?: number;
  @Field({ nullable: true }) nilai?: string;
  @Field({ nullable: true }) nilai3?: string;
  @Field({ nullable: true }) kurs?: string;
  @Field(() => Int, { nullable: true }) perkirId?: number;
  @Field({ nullable: true }) perkirNama?: string;
  @Field({ nullable: true }) lunasCair?: string;
  @Field({ nullable: true }) lunasCairKe?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field(() => Int, { nullable: true }) pelangId?: number;
  @Field({ nullable: true }) pelangNama?: string;
  @Field({ nullable: true }) cairchbg?: boolean;
}

@ObjectType()
export class ChbgPage {
  @Field(() => [ChbgRow]) rows: ChbgRow[];
  @Field(() => Int) total: number;
  @Field({ nullable: true }) totalNilai?: string;
}

@ObjectType()
export class ChbgRef {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field(() => Int, { nullable: true }) daerahId?: number;
  @Field({ nullable: true }) daerahNama?: string;
}
