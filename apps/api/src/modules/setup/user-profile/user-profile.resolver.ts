import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { UserProfileService } from "./user-profile.service";
import { SecGrup, SecGrupInput, SecGrupPage, SecUser, SecUserInput, SecUserPage } from "./user-profile.types";

@Resolver()
export class UserProfileResolver {
  constructor(private readonly service: UserProfileService) {}

  @Query(() => SecUserPage)
  secUserList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.userList(limit ?? 200, offset ?? 0, q);
  }

  @Query(() => SecUser, { nullable: true })
  secUserById(@Args("id", { type: () => Int }) id: number) {
    return this.service.userById(id);
  }

  @Query(() => SecGrupPage)
  secGrupList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.grupList(limit ?? 100, offset ?? 0, q);
  }

  @Query(() => SecGrup, { nullable: true })
  secGrupById(@Args("id", { type: () => Int }) id: number) {
    return this.service.grupById(id);
  }

  @Mutation(() => SecUser)
  createSecUser(@Args("input") input: SecUserInput) {
    return this.service.userCreate(input);
  }

  @Mutation(() => SecUser, { nullable: true })
  updateSecUser(@Args("id", { type: () => Int }) id: number, @Args("input") input: SecUserInput) {
    return this.service.userUpdate(id, input);
  }

  @Mutation(() => SecUser, { nullable: true })
  duplicateSecUser(@Args("id", { type: () => Int }) id: number) {
    return this.service.userDuplicate(id);
  }

  @Mutation(() => Boolean)
  deleteSecUser(@Args("id", { type: () => Int }) id: number) {
    return this.service.userSoftDelete(id);
  }

  @Mutation(() => SecGrup)
  createSecGrup(@Args("input") input: SecGrupInput) {
    return this.service.grupCreate(input);
  }

  @Mutation(() => SecGrup, { nullable: true })
  updateSecGrup(@Args("id", { type: () => Int }) id: number, @Args("input") input: SecGrupInput) {
    return this.service.grupUpdate(id, input);
  }

  @Mutation(() => Boolean)
  deleteSecGrup(@Args("id", { type: () => Int }) id: number) {
    return this.service.grupSoftDelete(id);
  }
}
