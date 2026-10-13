import { Module } from "@nestjs/common";
import { PurchaseOrderResolver } from "./purchase-order.resolver";
import { PurchaseOrderService } from "./purchase-order.service";

@Module({
  providers: [PurchaseOrderService, PurchaseOrderResolver],
})
export class PurchaseOrderModule {}
