import { Module } from "@nestjs/common";
import { SalesOrderResolver } from "./sales-order.resolver";
import { SalesOrderService } from "./sales-order.service";

@Module({
  providers: [SalesOrderService, SalesOrderResolver],
})
export class SalesOrderModule {}
