import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SecGrup {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) pemilik?: string;
  @Field({ nullable: true }) securityInfo?: string;
  @Field(() => Int, { nullable: true }) jumlahUser?: number;
}

@InputType()
export class SecGrupInput {
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) pemilik?: string;
}

@ObjectType()
export class SecGrupPage {
  @Field(() => [SecGrup]) rows: SecGrup[];
  @Field(() => Int) total: number;
}

@ObjectType()
export class SecUser {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) user?: string;
  @Field(() => Int, { nullable: true }) securiId?: number;
  @Field({ nullable: true }) grupNama?: string;
  @Field({ nullable: true }) pemilik?: string;
  @Field({ nullable: true }) sales?: number;
  @Field({ nullable: true }) userpusat?: boolean;
  @Field({ nullable: true }) workstat?: string;
  @Field({ nullable: true }) ip?: string;
  @Field({ nullable: true }) loginTgl?: string;
  @Field({ nullable: true }) loginJam?: string;
  @Field({ nullable: true }) hasPassword?: boolean;
}

@InputType()
export class SecUserInput {
  @Field({ nullable: true }) user?: string;
  @Field(() => Int, { nullable: true }) securiId?: number;
  @Field({ nullable: true }) pemilik?: string;
  @Field(() => Int, { nullable: true }) sales?: number;
  @Field({ nullable: true }) userpusat?: boolean;
  @Field({ nullable: true }) workstat?: string;
  @Field({ nullable: true }) ip?: string;
  @Field({ nullable: true }) password?: string;
}

@ObjectType()
export class SecUserPage {
  @Field(() => [SecUser]) rows: SecUser[];
  @Field(() => Int) total: number;
}
