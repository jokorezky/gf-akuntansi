import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UtilService } from "./util.service";
import { DbInfoRow, LookupResult } from "./util.types";

@Resolver()
export class UtilResolver {
  constructor(private readonly service: UtilService) {}

  @Query(() => [DbInfoRow])
  dbInfo(): Promise<DbInfoRow[]> {
    return this.service.dbInfo();
  }

  @Query(() => LookupResult)
  lookupList(@Args("kode") kode: string): Promise<LookupResult> {
    return this.service.lookupList(kode);
  }

  @Query(() => [DbInfoRow])
  khInfo(): Promise<DbInfoRow[]> {
    return this.service.khInfo();
  }

  @Mutation(() => String)
  khSave(@Args("jenis") jenis: string, @Args("tanggal") tanggal: string): Promise<string> {
    return this.service.khSave(jenis, tanggal);
  }

  @Query(() => LookupResult)
  hppTest(): Promise<LookupResult> {
    return this.service.hppTest();
  }

  @Query(() => LookupResult)
  pointInfo(): Promise<LookupResult> {
    return this.service.pointInfo();
  }

  @Query(() => LookupResult)
  totalTransaksi(@Args("dari") dari: string, @Args("sampai") sampai: string): Promise<LookupResult> {
    return this.service.totalTransaksi(dari, sampai);
  }

  @Query(() => [DbInfoRow])
  hapusPreview(@Args("sampai") sampai: string): Promise<DbInfoRow[]> {
    return this.service.hapusPreview(sampai);
  }

  @Mutation(() => String)
  hapusData(@Args("sampai") sampai: string, @Args("konfirmasi") konfirmasi: string): Promise<string> {
    return this.service.hapusData(sampai, konfirmasi);
  }
}
