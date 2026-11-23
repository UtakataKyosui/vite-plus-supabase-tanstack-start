import { useQuery } from "@tanstack/react-query";
import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { generateQRCode } from "~/api/generated/endpoints/items/items";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";

export function QrGenerator() {
  const [input, setInput] = useState("");
  const [data, setData] = useState("");

  const query = useQuery({
    queryKey: ["qrcode", data],
    queryFn: ({ signal }) => generateQRCode({ data }, { signal }),
    enabled: data.length > 0,
  });

  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!query.data) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);

  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          setData(input.trim());
        }}
      >
        <Label htmlFor="qr-data">Text or URL</Label>
        <div className="flex gap-2">
          <Input
            id="qr-data"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://..."
          />
          <Button type="submit" disabled={!input.trim()}>
            <QrCode />
            Generate
          </Button>
        </div>
      </form>
      {query.isFetching && <Skeleton className="mx-auto size-48 rounded-lg" />}
      {query.isError && (
        <p role="alert" className="text-sm text-destructive">
          Failed to generate the QR code.
        </p>
      )}
      {url && !query.isFetching && (
        <img
          src={url}
          alt={`QR code for ${data}`}
          className="mx-auto size-48 rounded-lg border bg-white p-2"
        />
      )}
    </div>
  );
}
