import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { VendorService } from "./vendor.service";
import { Vendor, VendorInput, VendorPage } from "./vendor.types";

@Resolver(() => Vendor)
export class VendorResolver {
  constructor(private readonly service: VendorService) {}

  @Query(() => VendorPage)
  vendorList(
    @Args("limit", { type: () => Int, nullable: true }) limit?: number,
    @Args("offset", { type: () => Int, nullable: true }) offset?: number,
    @Args("q", { nullable: true }) q?: string,
  ) {
    return this.service.list(limit ?? 50, offset ?? 0, q);
  }

  @Query(() => Vendor, { nullable: true })
  vendorById(@Args("id", { type: () => Int }) id: number) {
    return this.service.byId(id);
  }

  @Mutation(() => Vendor)
  createVendor(@Args("input") input: VendorInput) {
    return this.service.create(input);
  }

  @Mutation(() => Vendor, { nullable: true })
  updateVendor(@Args("id", { type: () => Int }) id: number, @Args("input") input: VendorInput) {
    return this.service.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteVendor(@Args("id", { type: () => Int }) id: number) {
    return this.service.softDelete(id);
  }
}
