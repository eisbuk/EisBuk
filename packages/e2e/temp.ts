/**
 * This file serves as a "gateway" for imports, which, are defined in a single-source-of-truth place, but we can't
 * import them directly, using package.json provided 'exports' field (node16 resolution), so we're importing them by specifying
 * the full path (including '/dist/' segment).
 *
 * This file is here to avoid having to change all the imports in the tests, and then change them, yet again, when cypress is updated to
 * use Webpack 5 (enabling node16 resolution).
 *
 * @TODO This should be updated (in the files), and this file removed completely, when Cypress' preprocessor is updated to use Webpack 5
 * (or Cypress sees reason and uses Vite instead of Webpack)
 * The issue: https://github.com/cypress-io/cypress/issues/19555
 */

export { getSlotTimespan } from "@eisbuk/shared";
export {
  Routes,
  PrivateRoutes,
  CustomerRoute,
  CloudFunction,
} from "@eisbuk/shared/dist/ui";

export { defaultUser } from "@eisbuk/testing/dist/envData";
export * from "@eisbuk/testing/dist/testIds";
