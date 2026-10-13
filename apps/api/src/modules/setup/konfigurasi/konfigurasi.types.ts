import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class KonfigurasiProfil {
  @Field(() => Int) sysId: number;
  @Field({ nullable: true }) versi?: number;
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field(() => Int, { nullable: true }) negara?: number;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) npwpNama?: string;
  @Field({ nullable: true }) pkpNo?: string;
  @Field({ nullable: true }) fakpjkNo?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) rekening1?: string;
  @Field({ nullable: true }) rekening2?: string;
  @Field({ nullable: true }) rekening3?: string;
  @Field({ nullable: true }) rekening4?: string;
  @Field({ nullable: true }) rekening5?: string;
  @Field({ nullable: true }) qris?: string;
  @Field({ nullable: true }) menuHotel?: boolean;
  @Field({ nullable: true }) menuKtv?: boolean;
  @Field({ nullable: true }) menuBill?: boolean;
}

@InputType()
export class KonfigurasiProfilInput {
  @Field({ nullable: true }) nama?: string;
  @Field({ nullable: true }) alamat?: string;
  @Field(() => Int, { nullable: true }) negara?: number;
  @Field({ nullable: true }) npwp?: string;
  @Field({ nullable: true }) npwpNama?: string;
  @Field({ nullable: true }) pkpNo?: string;
  @Field({ nullable: true }) fakpjkNo?: string;
  @Field({ nullable: true }) telepon?: string;
  @Field({ nullable: true }) fax?: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) website?: string;
  @Field({ nullable: true }) rekening1?: string;
  @Field({ nullable: true }) rekening2?: string;
  @Field({ nullable: true }) rekening3?: string;
  @Field({ nullable: true }) rekening4?: string;
  @Field({ nullable: true }) rekening5?: string;
  @Field({ nullable: true }) qris?: string;
  @Field({ nullable: true }) menuHotel?: boolean;
  @Field({ nullable: true }) menuKtv?: boolean;
  @Field({ nullable: true }) menuBill?: boolean;
}

@ObjectType()
export class KonfigDivisi {
  @Field(() => Int) id: number;
  @Field({ nullable: true }) divisi?: string;
}

@ObjectType()
export class KontNoRow {
  @Field(() => Int) sysId: number;
  @Field(() => Int, { nullable: true }) untuk?: number;
  @Field(() => Int, { nullable: true }) divisiId?: number;
  @Field(() => Int, { nullable: true }) tahun?: number;
  @Field(() => Int, { nullable: true }) last01?: number;
  @Field(() => Int, { nullable: true }) last02?: number;
  @Field(() => Int, { nullable: true }) last03?: number;
}

@ObjectType()
export class PcFlagRow {
  @Field(() => Int) sysId: number;
  @Field({ nullable: true }) hotel?: string;
  @Field({ nullable: true }) ktv?: string;
  @Field({ nullable: true }) billiard?: string;
  @Field({ nullable: true }) rental?: string;
  @Field({ nullable: true }) spa?: string;
}

@ObjectType()
export class KonfigurasiRingkas {
  @Field(() => KonfigurasiProfil, { nullable: true }) profil?: KonfigurasiProfil;
  @Field(() => [KonfigDivisi]) divisi: KonfigDivisi[];
  @Field(() => [KontNoRow]) kontNo: KontNoRow[];
  @Field(() => [PcFlagRow]) pcFlags: PcFlagRow[];
  @Field(() => Int) ownrCount: number;
  @Field(() => Int) kolomKontro: number;
  @Field(() => Int) koncabCount: number;
}
