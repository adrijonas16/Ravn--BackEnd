ALTER TABLE "product_images"
ADD COLUMN "product_variant_id" INTEGER;

CREATE INDEX "product_images_product_variant_id_sort_order_idx"
ON "product_images"("product_variant_id", "sort_order");

ALTER TABLE "product_images"
ADD CONSTRAINT "product_images_product_variant_id_fkey"
FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
