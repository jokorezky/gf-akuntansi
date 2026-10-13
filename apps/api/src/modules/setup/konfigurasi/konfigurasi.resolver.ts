import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { KonfigurasiService } from "./konfigurasi.service";
import { KonfigurasiProfil, KonfigurasiProfilInput, KonfigurasiRingkas } from "./konfigurasi.types";

@Resolver()
export class KonfigurasiResolver {
  constructor(private readonly service: KonfigurasiService) {}

  @Query(() => KonfigurasiRingkas)
  konfigurasiRingkas() {
    return this.service.ringkas();
  }

  @Mutation(() => KonfigurasiProfil, { nullable: true })
  simpanKonfigurasiProfil(@Args("input") input: KonfigurasiProfilInput) {
    return this.service.simpanProfil(input);
  }
}
