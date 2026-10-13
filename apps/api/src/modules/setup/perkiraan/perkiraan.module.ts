import { Module } from "@nestjs/common";
import { PerkiraanResolver } from "./perkiraan.resolver";
import { PerkiraanService } from "./perkiraan.service";

@Module({
  providers: [PerkiraanService, PerkiraanResolver],
})
export class PerkiraanModule {}
