import { Module } from "@nestjs/common";
import { PromosiResolver } from "./promosi.resolver";
import { PromosiService } from "./promosi.service";

@Module({
  providers: [PromosiService, PromosiResolver],
})
export class PromosiModule {}
