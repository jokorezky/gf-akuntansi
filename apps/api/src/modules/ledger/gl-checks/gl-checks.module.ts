import { Module } from "@nestjs/common";
import { GlChecksResolver } from "./gl-checks.resolver";
import { GlChecksService } from "./gl-checks.service";

@Module({
  providers: [GlChecksService, GlChecksResolver],
})
export class GlChecksModule {}
