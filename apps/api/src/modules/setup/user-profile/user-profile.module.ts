import { Module } from "@nestjs/common";
import { UserProfileResolver } from "./user-profile.resolver";
import { UserProfileService } from "./user-profile.service";

@Module({
  providers: [UserProfileService, UserProfileResolver],
})
export class UserProfileModule {}
