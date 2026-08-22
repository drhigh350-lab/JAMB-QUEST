export type ShareCardResult = "shared" | "downloaded" | "unavailable" | "dismissed";

function svgFile(svg: string, filename: string) {
  return new File([new Blob([svg], { type: "image/svg+xml;charset=utf-8" })], filename, { type: "image/svg+xml;charset=utf-8" });
}

export function downloadSvgCard(svg: string, filename: string): void {
  if (typeof document === "undefined") return;
  const file = svgFile(svg, filename);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const SVG_IMAGE_HREF = /(<image\b[^>]*?\bhref=")(.*?)(")/gi;

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Share-card image could not be read"));
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Share-card image produced no data URI"));
    reader.readAsDataURL(blob);
  });
}

/**
 * A blob-backed SVG has no reliable document base URL for an external `<image>`.
 * Resolve each approved hosted image first, then embed it so Canvas always receives
 * a self-contained SVG when producing the native-share PNG.
 */
export async function inlineSvgImageHrefs(svg: string): Promise<string> {
  if (typeof fetch === "undefined" || !SVG_IMAGE_HREF.test(svg)) return svg;
  SVG_IMAGE_HREF.lastIndex = 0;
  const hrefs = Array.from(svg.matchAll(SVG_IMAGE_HREF)).map((match) => match[2]).filter((href) => !href.startsWith("data:"));
  const uniqueHrefs = Array.from(new Set(hrefs));
  if (!uniqueHrefs.length) return svg;

  const resolved = new Map<string, string>();
  await Promise.all(uniqueHrefs.map(async (href) => {
    const response = await fetch(href, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Share-card image request failed: ${response.status}`);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("Share-card image response is not an image");
    resolved.set(href, await blobToDataUri(blob));
  }));

  SVG_IMAGE_HREF.lastIndex = 0;
  return svg.replace(SVG_IMAGE_HREF, (fullMatch, prefix: string, href: string, suffix: string) => {
    const dataUri = resolved.get(href);
    return dataUri ? `${prefix}${dataUri}${suffix}` : fullMatch;
  });
}

export async function rasterizeSvgToPngFile(svg: string, svgFilename: string, width: number, height: number): Promise<File> {
  if (typeof document === "undefined") return svgFile(svg, svgFilename);
  const selfContainedSvg = await inlineSvgImageHrefs(svg);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([selfContainedSvg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas rendering is unavailable");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error("PNG conversion failed"));
          resolve(new File([blob], svgFilename.replace(/\.svg$/i, ".png"), { type: "image/png" }));
        }, "image/png");
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG card could not be converted"));
    };
    image.src = url;
  });
}

export async function shareSvgCard(input: { svg: string; filename: string; title: string; text: string; width: number; height: number }): Promise<ShareCardResult> {
  if (typeof navigator === "undefined") return "unavailable";
  let file: File;
  try {
    // Android share targets commonly accept PNG files but reject SVG files, causing a download fallback.
    file = await rasterizeSvgToPngFile(input.svg, input.filename, input.width, input.height);
  } catch {
    file = svgFile(input.svg, input.filename);
  }
  const data = { title: input.title, text: input.text, files: [file] };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "dismissed";
    }
  }
  if (typeof document !== "undefined") {
    downloadSvgCard(input.svg, input.filename);
    return "downloaded";
  }
  return "unavailable";
}
