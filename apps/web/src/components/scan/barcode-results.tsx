import { Link } from "@tanstack/react-router";
import { PackagePlus } from "lucide-react";
import type { RepoBarcodeProduct } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

function toDraftSearch(product: RepoBarcodeProduct) {
  const entries: [string, string | undefined][] = [
    ["name", product.item?.name],
    ["description", product.item?.description],
    ["manufacturer", product.manufacturer ?? product.item?.manufacturer ?? undefined],
    ["modelNumber", product.modelNumber ?? product.item?.modelNumber ?? undefined],
    ["notes", product.notes],
    ["barcode", product.barcode],
  ];
  return Object.fromEntries(entries.filter(([, v]) => v)) as Record<string, string>;
}

export function BarcodeResults({ products }: { products: RepoBarcodeProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No product found. You can still register it as a new item.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {products.map((product, i) => {
        const image = product.imageURL
          ? product.imageURL
          : product.imageBase64
            ? `data:image/jpeg;base64,${product.imageBase64}`
            : undefined;
        return (
          <li key={`${product.barcode}-${product.search_engine_name}-${i}`}>
            <Card size="sm">
              <CardContent className="flex items-center gap-3">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="size-14 shrink-0 rounded-md border object-cover"
                  />
                ) : (
                  <div className="size-14 shrink-0 rounded-md border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.item?.name || "Unnamed product"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[product.manufacturer, product.modelNumber].filter(Boolean).join(" / ") ||
                      product.search_engine_name}
                  </p>
                </div>
                <Button
                  size="sm"
                  render={<Link to="/items/new" search={toDraftSearch(product) as never} />}
                >
                  <PackagePlus />
                  Use
                </Button>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
