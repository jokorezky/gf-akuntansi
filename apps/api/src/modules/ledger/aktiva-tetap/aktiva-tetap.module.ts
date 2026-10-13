import { Module } from "@nestjs/common";
import { AktivaTetapResolver } from "./aktiva-tetap.resolver";
import { AktivaTetapService } from "./aktiva-tetap.service";

@Module({
  providers: [AktivaTetapService, AktivaTetapResolver],
})
export class AktivaTetapModule {}
