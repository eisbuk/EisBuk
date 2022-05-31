import { Category } from "../enums/firestore";
import { DeprecatedCategory } from "../enums/deprecated/firestore";

/**
 * A union type of deprecated and currently supported categories.
 * We're mostily using this for category function params.
 */
export type CategoryUnion = Category | DeprecatedCategory;
