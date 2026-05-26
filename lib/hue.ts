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

/** 캐릭터/작성자 식별용 hue (--hue CSS 변수 주입) */
export function speakerHueStyle(key: string): React.CSSProperties {
  return { ["--hue" as string]: String(hueFromString(key)) };
}
