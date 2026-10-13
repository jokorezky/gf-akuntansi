import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AktivaTetap {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) beliDari?: string;
  @Field({ nullable: true }) jualKpd?: string;
  @Field({ nullable: true }) outKet?: string;
  @Field({ nullable: true }) tglBeli?: string;
  @Field({ nullable: true }) hargaBeli?: string;
  @Field({ nullable: true }) tglSusut?: string;
  @Field(() => Int, { nullable: true }) mtdSusut?: number;
  @Field({ nullable: true }) nilSusut?: string;
  @Field(() => Int, { nullable: true }) usiaSusut?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) perkirId1?: number;
  @Field(() => Int, { nullable: true }) perkirId2?: number;
  @Field({ nullable: true }) tglJual?: string;
  @Field({ nullable: true }) tglOut?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class AktivaTetapInput {
  @Field() nama: string;
  @Field({ nullable: true }) kode?: string;
  @Field({ nullable: true }) beliDari?: string;
  @Field({ nullable: true }) jualKpd?: string;
  @Field({ nullable: true }) outKet?: string;
  @Field({ nullable: true }) tglBeli?: string;
  @Field({ nullable: true }) hargaBeli?: string;
  @Field({ nullable: true }) tglSusut?: string;
  @Field(() => Int, { nullable: true }) mtdSusut?: number;
  @Field({ nullable: true }) nilSusut?: string;
  @Field(() => Int, { nullable: true }) usiaSusut?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) perkirId1?: number;
  @Field(() => Int, { nullable: true }) perkirId2?: number;
  @Field({ nullable: true }) tglJual?: string;
  @Field({ nullable: true }) tglOut?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class AktivaTetapPage {
  @Field(() => [AktivaTetap]) rows: AktivaTetap[];
  @Field(() => Int) total: number;
}
