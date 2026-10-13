import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Vendor {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) kodePos?: string;
  @Field(() => Int, { nullable: true }) daerahId?: number;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) telepon2?: string;
  @Field({ nullable: true }) telepon3?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) rekening1?: string;
  @Field({ nullable: true }) rekening2?: string;
  @Field({ nullable: true }) rekening3?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) hubungi?: string;
  @Field({ nullable: true }) hubTelp1?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) maxCrd?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field(() => Int, { nullable: true }) groupVenId?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class VendorInput {
  @Field() nama: string;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field({ nullable: true }) kodePos?: string;
  @Field(() => Int, { nullable: true }) daerahId?: number;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) telepon2?: string;
  @Field({ nullable: true }) telepon3?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) rekening1?: string;
  @Field({ nullable: true }) rekening2?: string;
  @Field({ nullable: true }) rekening3?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) hubungi?: string;
  @Field({ nullable: true }) hubTelp1?: string;
  @Field(() => Int, { nullable: true }) termCrd?: number;
  @Field({ nullable: true }) maxCrd?: string;
  @Field(() => Int, { nullable: true }) ppnTipe?: number;
  @Field({ nullable: true }) ppnPers?: string;
  @Field(() => Int, { nullable: true }) groupVenId?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class VendorPage {
  @Field(() => [Vendor]) rows: Vendor[];
  @Field(() => Int) total: number;
}
