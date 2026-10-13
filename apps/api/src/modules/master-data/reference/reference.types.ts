import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class JenpenRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class DivisiRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class DaerahRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class GrpvenRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class GrpstkRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class Grpst2Ref {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class Grpst3Ref {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class VendorRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}

@ObjectType()
export class PelangganRef {
  @Field(() => Int) id: number;
  @Field() nama: string;
}
