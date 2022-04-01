export * from "./enums/firestore";
export * from "./enums/errorMessages";
export * from "./types/firestore";
export * from "./types/cloudFunctions";
export * from "./utils";

import italianNames from "./assets/italian-names.json";
import italianSurnames from "./assets/italian-surnames.json";

export const FIRST_NAMES = italianNames;
export const LAST_NAMES = italianSurnames;