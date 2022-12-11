export * from "./enums/firestore";
export * from "./enums/errorMessages";
export * from "./enums/email";
export * from "./types/firestore";
export * from "./types/cloudFunctions";
export * from "./types/misc";
export * from "./types/email";
export * from "./utils";

export * from "./deprecated";

import italianNames from "./assets/italian-names.json";
import italianSurnames from "./assets/italian-surnames.json";

export const FIRST_NAMES = italianNames;
export const LAST_NAMES = italianSurnames;
