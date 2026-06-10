import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

/** Stylized fingerprint — concentric arcs for kiosk idle screen. */
export function FingerprintIcon({ size = 64, color = "#2563EB" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8c-8.8 0-16 7.2-16 16 0 2.2.4 4.3 1.2 6.2"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M32 12c-6.6 0-12 5.4-12 12 0 1.8.3 3.5.9 5"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M20 28c0-6.6 5.4-12 12-12s12 5.4 12 12v8c0 11-9 20-20 20S4 47 4 36v-4"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M24 32c0-4.4 3.6-8 8-8s8 3.6 8 8v6c0 6.6-5.4 12-12 12s-12-5.4-12-12v-2"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M28 36c0-2.2 1.8-4 4-4s4 1.8 4 4v4c0 2.2-1.8 4-4 4s-4-1.8-4-4v-1"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M32 20v4M26 22l2 3M38 22l-2 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
