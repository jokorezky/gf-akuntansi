import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";


@ObjectType()
export class Karyawan {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field(() => String, { nullable: true }) komisi?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) nonAktif?: string;
  @Field({ nullable: true }) sales?: boolean;
  @Field({ nullable: true }) supir?: boolean;
  @Field({ nullable: true }) helper?: boolean;
  @Field({ nullable: true }) collector?: boolean;
  @Field({ nullable: true }) admin?: boolean;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
}

@InputType()
export class KaryawanInput {
  @Field() nama: string;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field(() => String, { nullable: true }) komisi?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) nonAktif?: string;
  @Field({ nullable: true }) sales?: boolean;
  @Field({ nullable: true }) supir?: boolean;
  @Field({ nullable: true }) helper?: boolean;
  @Field({ nullable: true }) collector?: boolean;
  @Field({ nullable: true }) admin?: boolean;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
}

@ObjectType()
export class KaryawanPage {
  @Field(() => [Karyawan]) rows: Karyawan[];
  @Field(() => Int) total: number;
}

