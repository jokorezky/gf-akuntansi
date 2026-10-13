import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Item {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) barcode?: string;
  @Field({ nullable: true }) nama2?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field(() => Int, { nullable: true }) groupStkId?: number;
  @Field(() => Int, { nullable: true }) jenis?: number;
  @Field({ nullable: true }) hargaBeli?: string;
  @Field({ nullable: true }) hargaJual1?: string;
  @Field({ nullable: true }) hargaJual2?: string;
  @Field({ nullable: true }) hargaJual3?: string;
  @Field({ nullable: true }) hargaJual4?: string;
  @Field({ nullable: true }) hargaJual5?: string;
  @Field({ nullable: true }) minStock?: string;
  @Field(() => Int, { nullable: true }) tipeSatu?: number;
  @Field(() => Int, { nullable: true }) satDef?: number;
  @Field({ nullable: true }) nonPajak?: boolean;
  @Field({ nullable: true }) expired?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field({ nullable: true }) kode?: string;
  @Field(() => Int, { nullable: true }) satEcr?: number;
  @Field(() => Int, { nullable: true }) kursJual?: number;
  @Field(() => Int, { nullable: true }) satBeli?: number;
  @Field(() => Int, { nullable: true }) satMin?: number;
  @Field({ nullable: true }) minJual?: string;
  @Field(() => Int, { nullable: true }) minJlSt?: number;
  @Field(() => Int, { nullable: true }) satJ01?: number;
  @Field(() => Int, { nullable: true }) satJ02?: number;
  @Field(() => Int, { nullable: true }) satJ03?: number;
  @Field(() => Int, { nullable: true }) satJ04?: number;
  @Field(() => Int, { nullable: true }) satJ05?: number;
}

@InputType()
export class ItemInput {
  @Field() nama: string;
  @Field({ nullable: true }) barcode?: string;
  @Field({ nullable: true }) nama2?: string;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field(() => Int, { nullable: true }) groupStkId?: number;
  @Field(() => Int, { nullable: true }) jenis?: number;
  @Field({ nullable: true }) hargaBeli?: string;
  @Field({ nullable: true }) hargaJual1?: string;
  @Field({ nullable: true }) hargaJual2?: string;
  @Field({ nullable: true }) hargaJual3?: string;
  @Field({ nullable: true }) hargaJual4?: string;
  @Field({ nullable: true }) hargaJual5?: string;
  @Field({ nullable: true }) minStock?: string;
  @Field(() => Int, { nullable: true }) tipeSatu?: number;
  @Field(() => Int, { nullable: true }) satDef?: number;
  @Field({ nullable: true }) nonPajak?: boolean;
  @Field({ nullable: true }) expired?: boolean;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => Int, { nullable: true }) satEcr?: number;
  @Field(() => Int, { nullable: true }) kursJual?: number;
  @Field(() => Int, { nullable: true }) satBeli?: number;
  @Field(() => Int, { nullable: true }) satMin?: number;
  @Field({ nullable: true }) minJual?: string;
  @Field(() => Int, { nullable: true }) minJlSt?: number;
  @Field(() => Int, { nullable: true }) satJ01?: number;
  @Field(() => Int, { nullable: true }) satJ02?: number;
  @Field(() => Int, { nullable: true }) satJ03?: number;
  @Field(() => Int, { nullable: true }) satJ04?: number;
  @Field(() => Int, { nullable: true }) satJ05?: number;
}

@ObjectType()
export class ItemPage {
  @Field(() => [Item]) rows: Item[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class SisaStock {
  @Field(() => Int) id: number;
  @Field() nama: string;
  @Field({ nullable: true }) groupNama?: string;
  @Field({ nullable: true }) kode?: string;
  @Field(() => Int, { nullable: true }) tipeSatu?: number;
  @Field({ nullable: true }) sisa?: string;
  @Field({ nullable: true }) hargaJual1?: string;
  @Field({ nullable: true }) hargaJual2?: string;
  @Field({ nullable: true }) hargaJual3?: string;
  @Field({ nullable: true }) hargaJual4?: string;
  @Field({ nullable: true }) hargaJual5?: string;
}

@ObjectType()
export class SisaStockPage {
  @Field(() => [SisaStock]) rows: SisaStock[];
  @Field(() => Int) total: number;
}
