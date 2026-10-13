import { Module } from "@nestjs/common";
import { KaryawanResolver } from "./karyawan.resolver";
import { KaryawanService } from "./karyawan.service";

@Module({
  providers: [KaryawanService, KaryawanResolver],
})
export class KaryawanModule {}
