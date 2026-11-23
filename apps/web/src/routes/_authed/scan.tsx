import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ScanBarcode, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { productSearchFromBarcode } from "~/api/generated/endpoints/items/items";
import { PageHeader } from "~/components/layout/page-header";
import { BarcodeCamera } from "~/components/scan/barcode-camera";
import { BarcodeResults } from "~/components/scan/barcode-results";
import { QrGenerator } from "~/components/scan/qr-generator";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/scan")({
  component: ScanPage,
});

function ScanPage() {
  const [input, setInput] = useState("");
  const [barcode, setBarcode] = useState("");

  const search = useQuery({
    queryKey: ["barcode-search", barcode],
    queryFn: ({ signal }) => productSearchFromBarcode({ data: barcode }, { signal }),
    enabled: barcode.length > 0,
  });

  const onDetected = useCallback((value: string) => {
    setInput(value);
    setBarcode(value);
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader title="Scan" description="Look up a product by barcode or create a QR code." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanBarcode className="size-4" />
            Barcode lookup
          </CardTitle>
          <CardDescription>Scan with the camera or type the code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BarcodeCamera onDetected={onDetected} />
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              setBarcode(input.trim());
            }}
          >
            <Label htmlFor="barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="4901234567894"
              />
              <Button type="submit" disabled={!input.trim()}>
                <Search />
                Search
              </Button>
            </div>
          </form>
          {search.isFetching && <Skeleton className="h-20 w-full rounded-lg" />}
          {search.isError && (
            <p role="alert" className="text-sm text-destructive">
              The product search failed. Try again.
            </p>
          )}
          {search.data && !search.isFetching && <BarcodeResults products={search.data} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR code</CardTitle>
          <CardDescription>Generate a QR code for a label or a link.</CardDescription>
        </CardHeader>
        <CardContent>
          <QrGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
