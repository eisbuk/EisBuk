// this is a quick hack for weird eslint errors related to tsconfig.json
const getTsProject = () => {
  let root = __dirname;
  if (!root.includes("eisbuk-admin")) root += "/eisbuk-admin";
  console.log("TS Root > ", root);
  return `${root}/tsconfig.json`;
};

module.exports = {
  overrides: [
    {
      files: ["*.ts", "*.tsx"], // Your TypeScript files extension
      parserOptions: {
        project: [getTsProject()], // Specify it only for TypeScript files
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
  parserOptions: {
    // Required for certain syntax usages
    ecmaVersion: 2017,
    project: getTsProject(),
  },
  root: true,
  plugins: ["promise"],
  extends: [
    "google",
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:import/react",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  ignorePatterns: [
    "dist/*",
    "functions/*",
    "node_modules/*",
    "reportWebVitals.js",
    "config-overrides.js",
    "react-app-env.d.ts",
    "plopfile.js",
    // inspect below, I believe it caused no-unresolved problem with es-lint due to js-dom hack
    "setupTests.js",
  ],
  rules: {
    // Remove rule for props to require quotes
    "quote-props": "off",

    // Removed rule "disallow the use of console" from recommended eslint rules
    "no-console": "off",

    // Removed rule "disallow multiple spaces in regular expressions" from recommended eslint rules
    "no-regex-spaces": "off",

    // Removed rule "disallow the use of debugger" from recommended eslint rules
    "no-debugger": "off",

    // Removed rule "disallow unused variables" from recommended eslint rules
    "no-unused-vars": "off",

    // Removed rule "disallow mixed spaces and tabs for indentation" from recommended eslint rules
    "no-mixed-spaces-and-tabs": "off",

    // Removed rule "disallow the use of undeclared variables unless mentioned in /*global */ comments" from recommended eslint rules
    "no-undef": "off",

    // Warn against template literal placeholder syntax in regular strings
    "no-template-curly-in-string": 1,

    // Warn if return statements do not either always or never specify values
    "consistent-return": 1,

    // Warn if no return statements in callbacks of array methods
    "array-callback-return": 1,

    // Require the use of === and !==
    eqeqeq: 2,

    // Disallow the use of alert, confirm, and prompt
    "no-alert": 2,

    // Disallow the use of arguments.caller or arguments.callee
    "no-caller": 2,

    // Disallow null comparisons without type-checking operators
    "no-eq-null": 2,

    // Disallow the use of eval()
    "no-eval": 2,

    // Warn against extending native types
    "no-extend-native": 1,

    // Warn against unnecessary calls to .bind()
    "no-extra-bind": 1,

    // Warn against unnecessary labels
    "no-extra-label": 1,

    // Disallow leading or trailing decimal points in numeric literals
    "no-floating-decimal": 2,

    // Warn against shorthand type conversions
    "no-implicit-coercion": 1,

    // Warn against function declarations and expressions inside loop statements
    "no-loop-func": 1,

    // Disallow new operators with the Function object
    "no-new-func": 2,

    // Warn against new operators with the String, Number, and Boolean objects
    "no-new-wrappers": 1,

    // Disallow throwing literals as exceptions
    "no-throw-literal": 2,

    // Require using Error objects as Promise rejection reasons
    "prefer-promise-reject-errors": 2,

    // Enforce “for” loop update clause moving the counter in the right direction
    "for-direction": 2,

    // Enforce return statements in getters
    "getter-return": 2,

    // Disallow await inside of loops
    "no-await-in-loop": 2,

    // Disallow comparing against -0
    "no-compare-neg-zero": 2,

    // Warn against catch clause parameters from shadowing variables in the outer scope
    "no-catch-shadow": 1,

    // Disallow identifiers from shadowing restricted names
    "no-shadow-restricted-names": 2,

    // Enforce return statements in callbacks of array methods
    "callback-return": 2,

    // Require error handling in callbacks
    "handle-callback-err": 2,

    // Warn against string concatenation with __dirname and __filename
    "no-path-concat": 1,

    // Prefer using arrow functions for callbacks
    "prefer-arrow-callback": 1,

    // Return inside each then() to create readable and reusable Promise chains.
    // Forces developers to return console logs and http calls in promises.
    "promise/always-return": 2,

    // Enforces the use of catch() on un-returned promises
    "promise/catch-or-return": 2,

    // Warn against nested then() or catch() statements
    "promise/no-nesting": 1,

    // Swotch strings to single quote (offset recommended)
    quotes: "off",

    // Allow spacing in curly braces
    "object-curly-spacing": "off",

    // Max len is handled by prettier, if it turns out to be longer it's probbably a comment
    "max-len": "off",

    // Indentation on each line
    indent: "off",

    // Allow "?" and ":" to be at the beginning of the line in ternary expressions
    "operator-linebreak": "off",

    // Produces false positives in long function arguments, handled by prettier anyhow
    "comma-dangle": "off",

    // We use TypeScript for type annotation, JS Doc is here as documentation
    "valid-jsdoc": "off",

    // Allow for non-null asssertion as they're not inferred by TS with cloud functions
    "@typescript-eslint/no-non-null-assertion": "off",

    // Allow explicit any, but still avoid where possible
    "@typescript-eslint/no-explicit-any": "off",

    // we're using empty functions as fallback for unedfined props
    "@typescript-eslint/no-empty-function": "off",

    // This just gets in the way
    "import/no-named-as-default-member": "off",
    "import/no-named-as-default": "off",
  },
};
