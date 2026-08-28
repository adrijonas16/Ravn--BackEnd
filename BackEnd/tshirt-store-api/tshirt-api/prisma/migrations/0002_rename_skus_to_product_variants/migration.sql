ALTER TABLE "product_skus" RENAME TO "product_variants";

ALTER TABLE "cart_items" RENAME COLUMN "product_sku_id" TO "product_variant_id";
ALTER TABLE "order_items" RENAME COLUMN "product_sku_id" TO "product_variant_id";
ALTER TABLE "inventory_movements" RENAME COLUMN "product_sku_id" TO "product_variant_id";
ALTER TABLE "notifications" RENAME COLUMN "product_sku_id" TO "product_variant_id";
