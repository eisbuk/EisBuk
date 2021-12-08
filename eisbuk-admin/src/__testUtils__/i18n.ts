/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * We're using this file to import `i18n.t` function when needed in tests.
 * As a side effect `i18next` initialization is ran (since this file also imports "@/i18next/i18n.ts")
 */
import "@/i18next/i18n";
import i18n from "i18next";

// In cypress the translations might not get loaded
// unless we use `require` instead of `import`
const en = require("@/translations/en.json");
const it = require("@/translations/it.json");
const i18nAny: any = i18n;
i18nAny.translator.resourceStore.data.en.translation = en;
i18nAny.translator.resourceStore.data.it.translation = it;

export default i18n;
