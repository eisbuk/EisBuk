import * as React from "react";

import { Category } from "../enums/firestore";
import { DeprecatedCategory } from "../enums/deprecated/firestore";

/**
 * A union type of deprecated and currently supported categories.
 * We're mostily using this for category function params.
 */
export type CategoryUnion = Category | DeprecatedCategory;

/**
 * A type alias for svgr loaded SVG as React component
 */
export type SVGComponent = React.FunctionComponent<
  React.SVGProps<SVGSVGElement> & { title?: string }
>;
