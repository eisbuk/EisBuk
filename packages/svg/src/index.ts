import TestSVG from "./SVG.svg";
import Ice from "./Ice.svg";
import OffIce from "./OffIce.svg";
import ExclamationCircle from "./exclamation-circle.svg";
import Close from "./close.svg";
import AccountCircle from "./account-circle.svg";
import Calendar from "./calendar.svg";
import ChevronLeft from "./chevron-left.svg";
import ChevronRight from "./chevron-right.svg";
import EisbukLogo from "./logo.svg";
import People from "./people.svg";
import LibraryBooks from "./libraryBooks.svg";

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
  Ice,
  OffIce,
  EisbukLogo,
  People,
  LibraryBooks,
};
