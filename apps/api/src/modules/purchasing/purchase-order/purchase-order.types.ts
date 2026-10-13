import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PoLine {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) stockNama?: string;
  @Field({ nullable: true }) satuan?: string;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field({ nullable: true }) catatan?: string;
}

@InputType()
export class PoLineInput {
  @Field(() => Int) stockId: number;
  @Field({ nullable: true }) jumlah?: string;
  @Field({ nullable: true }) harga?: string;
  @Field(() => Int, { nullable: true }) satuan?: number;
  @Field({ nullable: true }) catatan?: string;
}

@ObjectType()
export class PurchaseOrder {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) vendorId?: number;
  @Field({ nullable: true }) vendorNama?: string;
  @Field({ nullable: true }) totHarga?: string;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PoLine], { nullable: true }) lines?: PoLine[];
}

@InputType()
export class PurchaseOrderInput {
  @Field({ nullable: true }) tanggal?: string;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int) vendorId: number;
  @Field({ nullable: true }) catatan?: string;
  @Field(() => [PoLineInput]) lines: PoLineInput[];
}

@ObjectType()
export class PurchaseOrderPage {
  @Field(() => [PurchaseOrder]) rows: PurchaseOrder[];
  @Field(() => Int) total: number;
}
