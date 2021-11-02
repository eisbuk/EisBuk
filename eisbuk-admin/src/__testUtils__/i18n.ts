/**
 * We're using this file to import `i18n.t` function when needed in tests.
 * As a side effect `i18next` initialization is ran (since this file also imports "@/i18next/i18n.ts")
 */
import "@/i18next/i18n";
import i18n from "i18next";

export default i18n;
