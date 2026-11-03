import { platformIcons } from '../data/platforms'

export default function PlatformIcon({ platform }: { platform: string }) {
  const icon = platformIcons[platform as keyof typeof platformIcons]
  return icon ? <span className={`platform-symbol platform-symbol-${platform}`} style={{ maskImage: `url("${icon}")`, WebkitMaskImage: `url("${icon}")` }} aria-hidden="true"/> : null
}
