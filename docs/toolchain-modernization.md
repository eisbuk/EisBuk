# Toolchain modernization

Assessed on October 1, 2026. This branch includes the already merged Node 22
runtime, deployment verification, and emulator compilation changes. Application
and trigger fixes still in progress can merge independently of this tooling work.

## Assessment of the recommendation

- Firebase CLI 13.35.1 is the last 13.x release; CLI 14 explicitly removed Node 18
  support. The ceiling applies to the CLI's local Node process, not the deployed
  functions runtime. [Firebase CLI release notes](https://firebase.google.com/support/release-notes/cli#version_1400_-_march_27_2025).
- Rush 5.66.2 / pnpm 6.32.3 kept this repository on Node 18. The old installation
  path failed on newer Node with `ERR_INVALID_THIS`. Upgrading these tools removes
  that restriction; it does not require a simultaneous Firebase generation change.
- Node 22 supports gen-1 functions, but **April 30, 2027 is deprecation** and
  **October 31, 2027 is decommission**. Deprecation ends runtime maintenance;
  decommission prevents new deployments and updates. Plan to finish migration
  before deprecation. Node 24's listed runtime supports Cloud Run functions,
  with deprecation on April 30, 2028 and decommission on October 31, 2028.
  [Google runtime support schedule](https://cloud.google.com/functions/docs/runtime-support).

Waiting until early 2027 to start upgrading the local toolchain would keep
development and CI on an unsupported Node release unnecessarily. Starting the
runtime migration in early 2027 remains reasonable if the preparation below is
completed first.

## Tooling changes in this branch

- Default development and CI Node: 24; supported tooling ranges: >=22.12 <23 and
  > =24.11 <25. The cloud runtime remains Node 22, declared in
  > `packages/functions/package.json`.
- Rush 5.180.0, pnpm 10.34.6, and Firebase CLI 15.31.0, installed through the
  repository wrappers and committed lockfiles. pnpm 10 is a conservative step
  from pnpm 6 with support for both chosen Node LTS lines.
- The lockfile migration preserves the direct application dependency versions;
  the two Firebase CLI declarations are the only changed direct selections in
  the main Rush lockfile. Rush regenerated its bootstrap scripts and lock hash.
- Java 21 for emulator runs, required by Firebase CLI 15. Dependency lifecycle
  scripts needed by Firebase, esbuild, and Cypress are explicitly enabled in
  `common/config/rush/pnpm-config.json`.
- CI uses `rush install`, so it validates the committed dependency graph instead
  of resolving new dependencies. Cache keys include toolchain configuration.
  Workflow templates and generated workflows must be updated together.
- CI emulator tests compile once and return the actual test status, preserving
  coverage and JUnit/HTML reports without leaving a background watcher or
  masking failures with `|| true`.
- First-party GitHub Actions use Node 24 action releases: checkout/setup-node
  v6, cache/setup-java v5. GitHub removed the Node 20 action runtime on September
  23, 2026. [GitHub announcement](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions/).
- Deployment preflight checks the exact pinned CLI and a supported local Node
  version. The existing Node 22 runtime check, deploy wrapper, and post-deployment
  verification stay in place.
- A separate Node 22 workflow exercises installation, deployment tooling,
  package builds, typechecks, the client build, and emulator tests.
- Generated HTML reports, `instrumented`, and `storybook-static` output is
  excluded from linting and test discovery, so building browser tests or
  Storybook does not cause duplicate test runs or parser errors in subsequent
  checks.

After pulling these changes:

```sh
nvm install
nvm use
export PATH="$PWD/common/scripts:$PATH"
git submodule update --init --recursive
java -version  # must be 21 or newer
rush install
rush build
node common/scripts/preflight-deploy.js
```

## Verification

Validated locally on Node 22.22.0 and Node 24.11.1: reproducible Rush
installation, package builds, typechecks, linting, production client builds,
and deployment preflight. The latest merged application changes pass 383
emulator tests on each Node line, with 11 existing skips. All 20 deployment
verifier/preflight tests pass.

On Node 24, Storybook and the instrumented browser-test build also pass, Cypress
13.2.0 verifies successfully, and the CI coverage/JUnit/HTML command exits zero
with no reported test failures. Generated build/report folders were present
when checking linting and test discovery. The pnpm 6 incompatibility was also
reproduced with an isolated package installation under Node 24: tarball requests
fail with `ERR_INVALID_THIS`.

## Functions migration after the parallel trigger work merges

The repository still uses firebase-functions 3.x. Upgrade the SDK as a separate
change, initially keeping every existing function on the explicit public
`firebase-functions/v1` entry points. Replace private imports under
`firebase-functions/lib/providers/*` with public v1 provider imports, update
the Admin SDK and test dependencies to satisfy the chosen SDK's peers, and
verify the exported function inventory and emulator behavior. An SDK upgrade
alone does not extend the Node 22 cloud runtime's lifecycle.

Before moving handlers to gen-2, build on the final booking-sync and delivery
idempotency changes. Test duplicate and reordered events, transaction retries,
and email/SMS delivery against those final implementations. Validate the Sentry
wrappers against the new callback and event signatures.

Inventory function names, regions (`europe-west6`), callable clients, HTTP
callbacks, schedules, secrets, and IAM service accounts. Source code currently
uses environment variables rather than `functions.config()`. Recheck this when
upgrading dependencies: Runtime Config is scheduled for decommission in March
2027, before Node 22 deprecation.

Migrate one function at a time in a staging project. Gen-1 and gen-2 functions
can coexist, but an existing function cannot be converted in place with the
same name. Background-trigger overlap can execute the business logic twice;
prove idempotency before enabling both. Move callable clients and HTTP callers
to the new names/URLs, preserve the intended region and service-account access,
and account for gen-2 concurrency. Keep old functions available until the new
handlers and traffic have been verified. Use the supported Node 24 runtime for
the migrated functions after checking Firebase's runtime support at that time.

Update `common/scripts/verify-deployment.js` as part of that migration: it
currently lists functions through the v1 API and checks gen-1 runtime and
environment fields. Add gen-2 API inventory, runtime/release checks, and tests
before relying on it to verify a mixed-generation deployment.

Target completion before April 30, 2027. Recheck provider schedules before each
deployment; these dates are provider policies, not guarantees encoded in the
repository. [Firebase's gen-2 migration guide](https://firebase.google.com/docs/functions/2nd-gen-upgrade).
