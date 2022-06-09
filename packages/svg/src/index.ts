import TestSVG from "./SVG.svg";
import ExclamationCircle from "./exclamation-circle.svg";
import Close from "./close.svg";
import AccountCircle from "./account-circle.svg";
import Calendar from "./calendar.svg";
import ChevronLeft from "./chevron-left.svg";
import ChevronRight from "./chevron-right.svg";

// Export a standard type for SVG component, to be used throughout the app
import type { SVGComponent } from "./types";
export type { SVGComponent };

// Export SVGs as react components
export {
  TestSVG,
  ExclamationCircle,
  Close,
  AccountCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
};
