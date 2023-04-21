import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
// import Backend from "i18next-http-backend";
import { DateTime } from "luxon";

// export all translation strings
export * from "./translations";
export * from "./utils";

// make sure all imports of 'useTranslation' go through this file
// and as a side effect run the initialization below
export { useTranslation };

/** @TEMP */
import en from "./dict/en.json";
import it from "./dict/it.json";
/** @TEMP */

i18n
  /** we're avoiding `.use(Backend)` in order to prevent unexpected behavior in chromatic checks @TODO fix this in the future */
  // .use(Backend)
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,
    fallbackLng: "en",
    react: {
      // this is temp as to not cause problems due to fallback not specified
      // in the fututre, we might want to integrate with some suspense/fallback logic
      useSuspense: false,
    },
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: (value, format, lng) => {
        if (DateTime.isDateTime(value)) {
          return value.setLocale(lng || "en").toFormat(format!);
        }
        return value;
      },
    },
  });

export default i18n;
