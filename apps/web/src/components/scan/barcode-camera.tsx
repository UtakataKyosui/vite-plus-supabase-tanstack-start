import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";

type Detector = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

type DetectorConstructor = new (options?: { formats?: string[] }) => Detector;

function getDetectorConstructor(): DetectorConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
}

type BarcodeCameraProps = {
  onDetected: (value: string) => void;
};

export function BarcodeCamera({ onDetected }: BarcodeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(getDetectorConstructor() !== undefined);
  }, []);

  useEffect(() => {
    const Detector = getDetectorConstructor();
    if (!active || !Detector) return;

    let cancelled = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const detector = new Detector();

    const tick = async () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      try {
        if (video.readyState >= 2) {
          const [code] = await detector.detect(video);
          if (code?.rawValue && !cancelled) {
            setActive(false);
            onDetected(code.rawValue);
            return;
          }
        }
      } catch {
        // フレーム単位の検出失敗は無視して次のフレームで再試行する
      }
      timer = setTimeout(tick, 250);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          await video.play();
        }
        tick();
      })
      .catch(() => {
        setError(
          "Could not access the camera. Check the browser permission or enter the code manually.",
        );
        setActive(false);
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, onDetected]);

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Camera scanning is not supported in this browser. Enter the barcode manually.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {active && (
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary/70" />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant={active ? "outline" : "secondary"}
        size="lg"
        className="w-full"
        onClick={() => {
          setError(null);
          setActive((v) => !v);
        }}
      >
        {active ? <CameraOff /> : <Camera />}
        {active ? "Stop camera" : "Scan with camera"}
      </Button>
    </div>
  );
}
