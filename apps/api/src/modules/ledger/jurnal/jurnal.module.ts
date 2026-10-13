import { Module } from "@nestjs/common";
import { JurnalResolver } from "./jurnal.resolver";
import { JurnalService } from "./jurnal.service";

@Module({
  providers: [JurnalService, JurnalResolver],
})
export class JurnalModule {}
