import type {} from "@mui/material/Button";
import type {} from "@mui/material/Chip";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    ghost: true;
    link: true;
  }
  interface ButtonPropsSizeOverrides {
    xs: true;
    icon: true;
    "icon-xs": true;
    "icon-sm": true;
    "icon-lg": true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    soft: true;
  }
}
