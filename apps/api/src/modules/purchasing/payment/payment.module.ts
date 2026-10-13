import { Module } from "@nestjs/common";
import { PaymentResolver } from "./payment.resolver";
import { PaymentService } from "./payment.service";

@Module({
  providers: [PaymentService, PaymentResolver],
})
export class PaymentModule {}
