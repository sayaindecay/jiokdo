export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function campaignHueStyle(slug: string): React.CSSProperties {
  return { ["--campaign-hue" as string]: String(hueFromString(slug)) };
}
