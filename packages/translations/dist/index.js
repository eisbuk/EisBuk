"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = void 0;
const i18next_1 = __importDefault(require("i18next"));
const react_i18next_1 = require("react-i18next");
Object.defineProperty(exports, "useTranslation", { enumerable: true, get: function () { return react_i18next_1.useTranslation; } });
const i18next_browser_languagedetector_1 = __importDefault(require("i18next-browser-languagedetector"));
// import Backend from "i18next-http-backend";
const luxon_1 = require("luxon");
// export all translation strings
__exportStar(require("./translations"), exports);
__exportStar(require("./utils"), exports);
/** @TEMP */
const en_json_1 = __importDefault(require("./dict/en.json"));
const it_json_1 = __importDefault(require("./dict/it.json"));
/** @TEMP */
i18next_1.default
    /** we're avoiding `.use(Backend)` in order to prevent unexpected behavior in chromatic checks @TODO fix this in the future */
    // .use(Backend)
    .use(i18next_browser_languagedetector_1.default)
    // pass the i18n instance to react-i18next.
    .use(react_i18next_1.initReactI18next)
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
    resources: {
        en: { translation: en_json_1.default },
        it: { translation: it_json_1.default },
    },
    interpolation: {
        escapeValue: false,
        format: (value, format, lng) => {
            if (luxon_1.DateTime.isDateTime(value)) {
                return value.setLocale(lng || "en").toFormat(format);
            }
            return value;
        },
    },
});
exports.default = i18next_1.default;
//# sourceMappingURL=index.js.map