import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { DbModule } from "./db/db.module";
import { KaryawanModule } from "./modules/master-data/karyawan/karyawan.module";
import { VendorModule } from "./modules/master-data/vendor/vendor.module";
import { PelangganModule } from "./modules/master-data/pelanggan/pelanggan.module";
import { ItemModule } from "./modules/master-data/item/item.module";
import { ReferenceModule } from "./modules/master-data/reference/reference.module";
import { PurchaseModule } from "./modules/purchasing/purchase/purchase.module";
import { PurchaseOrderModule } from "./modules/purchasing/purchase-order/purchase-order.module";
import { ReturPembelianModule } from "./modules/purchasing/retur-pembelian/retur-pembelian.module";
import { DepositPembelianModule } from "./modules/purchasing/deposit-pembelian/deposit-pembelian.module";
import { PaymentModule } from "./modules/purchasing/payment/payment.module";
import { SaleModule } from "./modules/sales/sale/sale.module";
import { SalesOrderModule } from "./modules/sales/sales-order/sales-order.module";
import { ReturPenjualanModule } from "./modules/sales/retur-penjualan/retur-penjualan.module";
import { ReceiptModule } from "./modules/sales/receipt/receipt.module";
import { PosModule } from "./modules/sales/pos/pos.module";
import { KasModule } from "./modules/cash/kas.module";
import { ChbgModule } from "./modules/cash/chbg/chbg.module";
import { JurnalModule } from "./modules/ledger/jurnal/jurnal.module";
import { AktivaTetapModule } from "./modules/ledger/aktiva-tetap/aktiva-tetap.module";
import { GlChecksModule } from "./modules/ledger/gl-checks/gl-checks.module";
import { BarangTransferModule } from "./modules/inventory/barang-transfer/barang-transfer.module";
import { BarangPindahGudangModule } from "./modules/inventory/barang-pindah-gudang/barang-pindah-gudang.module";
import { BarangModule } from "./modules/inventory/barang/barang.module";
import { PromosiModule } from "./modules/inventory/promosi/promosi.module";
import { ProduksiModule } from "./modules/inventory/produksi/produksi.module";
import { LaporanModule } from "./modules/laporan/laporan.module";
import { PerkiraanModule } from "./modules/setup/perkiraan/perkiraan.module";
import { TipePembayaranModule } from "./modules/setup/tipe-pembayaran/tipe-pembayaran.module";
import { EceranListModule } from "./modules/setup/eceran-list/eceran-list.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "dist/schema.gql"),
      sortSchema: true,
      playground: false,
    }),
    DbModule,
    KaryawanModule,
    VendorModule,
    PelangganModule,
    ItemModule,
    ReferenceModule,
    PurchaseModule,
    PurchaseOrderModule,
    ReturPembelianModule,
    DepositPembelianModule,
    PaymentModule,
    SaleModule,
    SalesOrderModule,
    ReturPenjualanModule,
    ReceiptModule,
    PosModule,
    KasModule,
    ChbgModule,
    JurnalModule,
    AktivaTetapModule,
    GlChecksModule,
    BarangModule,
    BarangTransferModule,
    BarangPindahGudangModule,
    PromosiModule,
    ProduksiModule,
    LaporanModule,
    PerkiraanModule,
    TipePembayaranModule,
    EceranListModule,
  ],
})
export class AppModule {}
