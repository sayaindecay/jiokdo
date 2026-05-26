// 클라이언트 전용 이미지 리사이즈 — File 을 받아 최대 maxDim x maxDim 으로
// 줄이고 JPEG data URL 로 반환. 원본이 작거나 PNG 투명도가 필요한 경우 등을
// 위한 옵션은 단순화 (현재 캐릭터/캠페인/에너미 모두 사진 톤이라 JPEG 충분).

export type ResizeOptions = {
  maxDim?: number;     // 가로/세로 중 긴 변의 픽셀 상한
  quality?: number;    // JPEG 품질 (0~1)
  mimeType?: string;
};

export async function fileToResizedDataUrl(
  file: File,
  opts: ResizeOptions = {}
): Promise<string> {
  const maxDim = opts.maxDim ?? 1024;
  const quality = opts.quality ?? 0.85;
  const mimeType = opts.mimeType ?? "image/jpeg";

  // GIF 는 애니메이션 손실 가능 — 그냥 원본 data URL 반환
  if (file.type === "image/gif") {
    return await fileToDataUrl(file);
  }

  const bitmap = await loadBitmap(file);
  const { width: w, height: h } = bitmap;
  const longest = Math.max(w, h);

  // 이미 작으면 리사이즈 없이 그대로 data URL 변환 (단 원본이 1MB 초과시엔 강제 리사이즈)
  if (longest <= maxDim && file.size <= 1_000_000) {
    bitmap.close?.();
    return await fileToDataUrl(file);
  }

  const scale = longest > maxDim ? maxDim / longest : 1;
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(targetW, targetH)
    : Object.assign(document.createElement("canvas"), { width: targetW, height: targetH });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    bitmap.close?.();
    return await fileToDataUrl(file);
  }
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
  bitmap.close?.();

  if (canvas instanceof HTMLCanvasElement) {
    return canvas.toDataURL(mimeType, quality);
  }
  // OffscreenCanvas
  const blob = await canvas.convertToBlob({ type: mimeType, quality });
  return await blobToDataUrl(blob);
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // 일부 브라우저는 SVG 등 실패 — fallback 으로
    }
  }
  // fallback: HTMLImageElement
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
    });
    // ImageBitmap 흉내 — drawImage 는 HTMLImageElement 도 받지만 타입상 ImageBitmap 으로 캐스팅
    return img as unknown as ImageBitmap;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("read failed"));
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("blob read failed"));
    };
    reader.onerror = () => reject(new Error("blob read failed"));
    reader.readAsDataURL(blob);
  });
}
