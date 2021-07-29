import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { DateTime } from "luxon";

// import ns1 from 'locales/en/ns1.json';
// import ns2 from 'locales/en/ns2.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: "en",
    react: {
      // this is temp as to not cause problems due to fallback not specified
      // in the fututre, we might want to integrate with some suspense/fallback logic
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
      format: (value, format, lng) => {
        if (value instanceof DateTime) {
          return value.setLocale(lng || "en").toFormat(format!);
        }
        return value;
      },
    },
  });

// export default i18n;
