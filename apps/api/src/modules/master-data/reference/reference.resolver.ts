import { Inject } from "@nestjs/common";
import { Query, Resolver } from "@nestjs/graphql";
import { Pool } from "pg";
import { PG_POOL } from "../../../db/pg.provider";
import { DaerahRef, DivisiRef, Grpst2Ref, Grpst3Ref, GrpstkRef, GrpvenRef, JenpenRef, PelangganRef, VendorRef } from "./reference.types";

@Resolver()
export class ReferenceResolver {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Query(() => [JenpenRef])
  async jenpenRefList(): Promise<JenpenRef[]> {
    const r = await this.pool.query(`SELECT id, jenis AS nama FROM gf.s_jenpen WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as JenpenRef[];
  }

  @Query(() => [DivisiRef])
  async divisiRefList(): Promise<DivisiRef[]> {
    const r = await this.pool.query(`SELECT id, divisi AS nama FROM gf.s_divisi WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as DivisiRef[];
  }

  @Query(() => [DaerahRef])
  async daerahRefList(): Promise<DaerahRef[]> {
    const r = await this.pool.query(`SELECT id, daerah AS nama FROM gf.s_daerah WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as DaerahRef[];
  }

  @Query(() => [GrpvenRef])
  async grpvenRefList(): Promise<GrpvenRef[]> {
    const r = await this.pool.query(`SELECT id, nama FROM gf.s_grpven WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as GrpvenRef[];
  }

  @Query(() => [GrpstkRef])
  async grpstkRefList(): Promise<GrpstkRef[]> {
    const r = await this.pool.query(`SELECT id, nama FROM gf.s_grpstk WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as GrpstkRef[];
  }

  @Query(() => [Grpst2Ref])
  async grpst2RefList(): Promise<Grpst2Ref[]> {
    const r = await this.pool.query(`SELECT id, nama FROM gf.s_grpst2 WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as Grpst2Ref[];
  }

  @Query(() => [Grpst3Ref])
  async grpst3RefList(): Promise<Grpst3Ref[]> {
    const r = await this.pool.query(`SELECT id, nama FROM gf.s_grpst3 WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as Grpst3Ref[];
  }

  @Query(() => [VendorRef])
  async vendorRefList(): Promise<VendorRef[]> {
    const r = await this.pool.query(`SELECT id, nama FROM gf.s_vendor WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as VendorRef[];
  }

  @Query(() => [PelangganRef])
  async pelangganRefList(): Promise<PelangganRef[]> {
    const r = await this.pool.query(`SELECT id::int AS id, nama FROM gf.s_pelang WHERE hapus_oleh IS NULL ORDER BY id`);
    return r.rows as PelangganRef[];
  }
}
