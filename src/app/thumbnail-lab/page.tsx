"use client";

import { useRef, useState } from "react";
import { PageHeader, Badge, Meter } from "@/components/ui";
import { ImagePlus, Sparkles, ShieldCheck } from "lucide-react";

interface Analysis {
  score: number;
  brightness: number;
  contrast: number;
  colorfulness: number;
  clarity: number; // inverse of busyness
  aspectOk: boolean;
  width: number;
  height: number;
  improvements: string[];
}

/** Client-side heuristic thumbnail analysis via canvas pixel sampling. */
function analyze(img: HTMLImageElement): Analysis {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = 320);
  const h = (canvas.height = Math.round((img.height / img.width) * 320)) || 180;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let sum = 0;
  let sumSq = 0;
  let colorVar = 0;
  let busy = 0;
  const lum: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum.push(l);
    sum += l;
    sumSq += l * l;
    colorVar += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
  }
  const n = lum.length;
  const brightness = sum / n;
  const contrast = Math.sqrt(sumSq / n - brightness * brightness);
  const colorfulness = colorVar / n / 3;

  // busyness: mean abs diff between horizontally-adjacent luminance samples
  for (let y = 0; y < h; y++) {
    for (let x = 1; x < w; x++) {
      busy += Math.abs(lum[y * w + x] - lum[y * w + x - 1]);
    }
  }
  busy = busy / (n - h);
  const clarity = Math.max(0, 100 - busy * 2.2); // lower busyness → clearer

  const ratio = img.width / img.height;
  const aspectOk = Math.abs(ratio - 16 / 9) < 0.15;

  // composite score
  const contrastScore = Math.min(100, (contrast / 70) * 100);
  const brightnessScore = 100 - Math.abs(brightness - 130) * 0.7;
  const colorScore = Math.min(100, colorfulness * 2.5);
  const score = Math.round(
    Math.max(0, Math.min(100,
      contrastScore * 0.3 + clarity * 0.3 + colorScore * 0.2 + brightnessScore * 0.15 + (aspectOk ? 5 : 0)
    ))
  );

  const improvements: string[] = [];
  if (contrast < 45) improvements.push("Low contrast — separate your subject from the background so it pops in the feed.");
  if (clarity < 55) improvements.push("The image looks busy — simplify to one clear focal point and cut small details that vanish on mobile.");
  if (brightness < 70) improvements.push("It's quite dark — brighten the subject; dark thumbnails lose to bright ones in the feed.");
  if (brightness > 200) improvements.push("Very bright/washed out — add a darker area behind any text for readability.");
  if (colorfulness < 20) improvements.push("Muted colors — add one saturated accent color to draw the eye.");
  if (!aspectOk) improvements.push("Use a 16:9 image (1280×720) so YouTube doesn't crop it.");
  if (improvements.length === 0) improvements.push("Strong fundamentals — A/B test two variants in the Experiment Engine to find the winner.");

  return {
    score,
    brightness: Math.round(brightness),
    contrast: Math.round(contrastScore),
    colorfulness: Math.round(colorScore),
    clarity: Math.round(clarity),
    aspectOk,
    width: img.width,
    height: img.height,
    improvements: improvements.slice(0, 3),
  };
}

export default function ThumbnailLab() {
  const [src, setSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(file: File) {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => setAnalysis(analyze(img));
    img.src = url;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Lab"
        subtitle="Upload a thumbnail for a composition, contrast and clarity score — computed locally in your browser."
      />

      <div className="flex items-center gap-2 text-xs text-ink-dim">
        <ShieldCheck className="h-4 w-4 text-accent-green" /> Images are analyzed on-device and never uploaded.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div
            className="grid aspect-video place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-bg-soft"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) onFile(f);
            }}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="thumbnail preview" className="h-full w-full object-contain" />
            ) : (
              <button onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-2 text-ink-dim">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Click or drop an image</span>
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button onClick={() => inputRef.current?.click()} className="btn-ghost mt-3 w-full">
            <ImagePlus className="h-4 w-4" /> Choose thumbnail
          </button>
        </div>

        <div className="card">
          {!analysis ? (
            <div className="grid h-full place-items-center text-sm text-ink-dim">
              Upload a thumbnail to see its score.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Thumbnail Score</h2>
                <div className="text-3xl font-bold text-ink">
                  {analysis.score}
                  <span className="text-base font-normal text-ink-dim"> / 100</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <Row label="Contrast" value={analysis.contrast} />
                <Row label="Clarity / focal point" value={analysis.clarity} />
                <Row label="Colorfulness" value={analysis.colorfulness} />
                <Row label="Brightness balance" value={Math.max(0, Math.min(100, 100 - Math.abs(analysis.brightness - 130)))} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={analysis.aspectOk ? "green" : "amber"}>
                  {analysis.width}×{analysis.height} {analysis.aspectOk ? "· 16:9 ✓" : "· not 16:9"}
                </Badge>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Sparkles className="h-4 w-4 text-brand" /> 3 strongest improvements
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-ink-soft">{label}</span>
      <Meter value={value} tone={value >= 70 ? "green" : value >= 45 ? "amber" : "brand"} />
      <span className="w-8 text-right text-sm font-medium text-ink">{Math.round(value)}</span>
    </div>
  );
}
