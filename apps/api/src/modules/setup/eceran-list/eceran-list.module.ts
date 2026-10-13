import { Module } from "@nestjs/common";
import { EceranListResolver } from "./eceran-list.resolver";
import { EceranListService } from "./eceran-list.service";

@Module({
  providers: [EceranListService, EceranListResolver],
})
export class EceranListModule {}
