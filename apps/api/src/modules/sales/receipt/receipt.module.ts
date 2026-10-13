import { Module } from "@nestjs/common";
import { ReceiptResolver } from "./receipt.resolver";
import { ReceiptService } from "./receipt.service";

@Module({
  providers: [ReceiptService, ReceiptResolver],
})
export class ReceiptModule {}
