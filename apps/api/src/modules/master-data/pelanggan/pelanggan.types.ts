import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Pelanggan {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) kode?: string;
  @Field(() => Int, { nullable: true }) title?: number;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) kodePos?: string;
  @Field(() => Int, { nullable: true }) daerahId?: number;
  @Field(() => Int, { nullable: true }) negaraId?: number;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) telepon2?: string;
  @Field({ nullable: true }) telepon3?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) hubungi?: string;
  @Field({ nullable: true }) hubTelp1?: string;
  @Field(() => Int, { nullable: true }) tipe?: number;
  @Field(() => Int, { nullable: true }) groupPelId?: number;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) maxCrd?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PelangganInput {
  @Field() nama: string;
  @Field({ nullable: true }) kode?: string;
  @Field(() => Int, { nullable: true }) title?: number;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) kodePos?: string;
  @Field(() => Int, { nullable: true }) daerahId?: number;
  @Field(() => Int, { nullable: true }) negaraId?: number;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) telepon2?: string;
  @Field({ nullable: true }) telepon3?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) hubungi?: string;
  @Field({ nullable: true }) hubTelp1?: string;
  @Field(() => Int, { nullable: true }) tipe?: number;
  @Field(() => Int, { nullable: true }) groupPelId?: number;
  @Field(() => Int, { nullable: true }) jenpenId?: number;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) maxCrd?: string;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PelangganPage {
  @Field(() => [Pelanggan]) rows: Pelanggan[];
  @Field(() => Int) total: number;
}
