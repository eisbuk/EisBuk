export const EISBUK_SITE = process.env.EISBUK_SITE;

// Unfortunately Babel caches the compiled version of this file until the file changes.
// transform-inline-environment-variables is supposed to replace the value above for us.
// But we'd like the file to be recompiled when an environment variable changes.
// So we came up with this ugly hack: a string in this file that has no impact on the code,
// and can be changed by the startup script.
// This file is included in .gitignore for convenience
// Date this was last changed: Sun 18 Jul 16:40:01 EET 2021
