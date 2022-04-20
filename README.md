# EisBuk

## Booking management for ice skating lessons

### As an admin you can:

- login as an admin in an organization.
- create slots
- slots have the following properties:
  - multiple intervals
  - type: on or off-ice
  - categories: competitive level of athletes for a given slot (can contain multiple aptitute levels)
- mark athletes as present or absent for each slot/interval + get a print ready attendance sheet.
- manage athletes, with data like: birthday, category, covid certificate release date, etc.
- view and manage your slots in calendar view.

### As an athlete you can:

- view available slots without logging in, using a secret uinque url as authentication.
- book a slot according to your level and the type of session you need.
- view your booked slots in calendar view.

## Built with:

- - [ReactJS](https://reactjs.org/) - open-source JavaScript library for building user interfaces.
- - [Firebase](https://firebase.google.com/) - Google's backend as a service with corresponding SDK(s)
- - [ESBuild](https://esbuild.github.io/) - a lightning fast bundler/transpiler for JS (written in Go)
- - [Vite](https://vitejs.dev/) - a fully featured HMR dev-server, bundler and more, built on top of Parcel and ESBuild

### Repo managed with:

- - [pnpm](https://pnpm.io/) - a fast and storage efficient pacakge manager (pnpm stands for "performant npm")
- - [Rush](https://rushjs.io/) - a monorepo management tool built for large projects, seamlessly integratable with pnpm, npm, yarn

### CI

- - [Click here](./README_CI.md) to read about the CI infrastructure for the project

## Working with the project

### Installation

The entire repo is manaaged by **Rush** so you need to have Rush installed globally. We're using version `5.66.2` so you can run:

```bash
npm install -g @microsoft/rush
```

Additionally, we're using **pnpm**, which you can install manually or have Rush install for you. To install manually, run:

```bash
npm install -g pnpm
```

With management tools installed, run `rush update` from any point in the repo to install all dependencies per package basis. Additionally, it makes sense to run `rush build` in order to build all of the _lib_ styled packages (shared, functions, etc.). The client app is built manually.

### Day to day workflow

As the repo is managed by rush, we use `rush` and `rushx` commands for running of the scripts:

- `rushx` is a command similar to `npm run` or `yarn` and is used to run a script from package.json, with a simple caveat: it needs to ba called from within a package, no `--prefix` or `--cwd` options
- `rush <command>` can be used to run one of the `global`/`bulk` commands on the repo:

  - global command - if we, for instance, run `rush emulators:start` from enywhere in the repo, the firebase emulators will be spun up
  - bulk command - if we, for instance, run `rush lint:staged` from anywhere within the repo, the `lint:staged` script of each package.json will be ran, which provides a convenient way linting all of the packages using single command
  - for all global/bluk commands, see [command-line.json](./common/config/rush/command-line.json)

### Adding/removing deps from packages

To add a dependency, you can simply run `rush add --package <package_name>` **don't use pnpm add or npm install, etc.**. Additionally, you can add a dependency, manually, to package's `package.json`, after which you need to run `rush update`

To remove a dependency, simply remove it from `package.json` and run `rush update`

### Monorepo debugging

The recommended node version for the monorepo is (as stated in `.nvmrc`) `14.18.1`. If you're using nvm (and have the given node version installed), it's sufficient to run `nvm use` anywhere in the repo to switch to appropriate version.

Some unexpected and cryptic errors might arise from a corrupt shrinkwrap file, at which point running the following might prove useful:

```bash
rush update --full
```

### Common local work (dev) flows

#### Dev server flow - Vite server + Firebase emulators:

In order to work locally, we're leveraging the power of [firebase emulator suite](https://firebase.google.com/docs/emulator-suite) in lieu of firebase production backend.

To start the emulators, run:

```bash
rush emulators:start
```

This will run emulators for firebase services (auth, functions, firestore and hosting) with emulators dashboard at http://localhost:4000
Alternatively you can run `rush emulators:inspect` (instead of `emulators:start`), which allows you to connect with a debugger, for instance chrome from chrome://inspect/#devices or from the VSCode debugger.

With the emulators up and running, you can go ahead and start the dev server for the client app:

```bash
cd packages/client
rushx start
```

In order to start the development and observe in app functionality, you need to create the default admins.
Head your browser to http://localhost:3000/debug and click the `Create admin test users` button. This will create a default admin user and leave you logged in.
If you want to sign out and sign back in, the credentials (for a default admin) are:

- **email:** "test@eisbuk.it"
- **password:** "test00"

#### Storybook dev flow:

Storybook is ran, as per usual, without the need for emulators. Simply run the `storybook` command from the `/client` app

```bash
cd packages/client
rushx storybook
```

#### JEST tests

To run JEST (unit) tests, run

```bash
cd packages/client
rushx test
```

There's no need to spin up the emulators as unit tests use different emulator set up and the emulators are (automatically) spun up when needed.

Running `test` as in the above example runs all of the unit tests with full emulators support
Alternatively, you can run `rushx test:quicktest` to run the tests without the emulators. This, however will skip all of the tests requiring emulator support.

#### E2E Tests - Cypress

To run E2E tests, you need to start up the emulators and the dev server (as in the first working flow) and additionally run cypress.
First you need to

```bash
cd packages/e2e
```

From there, you can either run all e2e tests at once by running `rush cypress:run` (more often used in CI), or, the more interactive way (preferred for development, TDD), open the Cypress dashboard by running `rush cypress:open`

## Packages

The repo is structured as a monorepo, so each divisible unit of functionality is separated into its own package.

The packages are named by prepending `@eisbuk` to each package name (as form of namespacing). The prefix, however, is omitted in the folder structure, i.e. path to `@eisbuk/client` folder is `/packages/client`, etc.

All of the packages have the same basic scripts (except for `@eisbuk/scaffold` which doesn't utilize any functionality). Each package, then, features it's own additional scripts, but these are the standard ones:

- `build` - builds the app/lib using Vite/ESBuild (in case of library, builds both `esm` and `cjs` versions), after build, runs `typecheck` to generate the `.d.ts` files, theres also a bulk `rush build` command which runs `build` in each package
- `lint` - lints the package (for development)
- `lint:strict` - lints the package with failure if more than 0 errors/warnings (for pre-commit, CI), there's also a bulk `rush lint:strict` command which runs `lint:strict` in each package (this is mostly used for CI, while the, singular, `lint` script is used in dev)
- `typecheck` - runs typescript check (for CI, with `--noEmit` flag), there's also a bulk `rush typecheck` command which runs `typecheck` in each package

We currently feature the following packages:

### @eisbuk/scaffold

The smallest of the packages, doesn't utilize any build process. Contains the "templates", more like base configs for eslint (`.eslintrc.js`) and typescript (`tsconfig.json`). We're using those files to provide a single source of truth (and simplify editing of the setup while preserving the consistency across the packages) as `tsconfig.json` and `.eslintrc.js` for each package are an extension of the base setup with some, would be, tweaks.

### @eisbuk/shared

This folder contains some code: functions, enums, types, etc. shared among the `@eisbuk/client` and "backend" (`@eisbuk/functions`) app. The build process is done by Vite by running the `build` script.

### @eisbuk/translations

Similar to `@eisbuk/shared` package, translations contains code shared among different packages, related to i18n, such as translation enums, translation dictionaries as well as `i18next` setup. The build process is handled by Vite, in much the same way as `@eisbuk/shared` package.

### @eisbuk/functions

The functions package contains the code for "serverless" cloud functions. The functions are ran as part of the firebase emulators and, as part of CI/CD process, deployed, at production, to firebase "backend". The functions are built/served using ESBuild as a build tool, as Vite was an unnecessary complication at this point. The commands are `build` and `watch`.

### @eisbuk/client

The client package contains our main (browser) app. Currently all of our unit tests are contained within this package as well. The scripts connected to this package have already been explained above. The build/serve is handled by Vite, while unit tests are implemented using jest + react-testing-library.

_Please note: client build process is a bit lengthier than that of the shared, functions, etc.. packages. Therefore, `build` script in client package does nothing, not to slow down the bulk `rush build` command. If you wish to build the `@eisbuk/client` package for production, `rushx build:prod` should be ran instead (from `packages/client`)_

### @eisbuk/e2e

A package containing automated, e2e tests using Cypress. All of the Cypress code, setup + integration are there and e2e tests should be ran from there (with assumption that some form of emulators/dev-server are already running)

## Contribution

EisBuk is a booking system developed for an ice skating school.
It's open source, so if it fits your needs you can install it and use it.

If you want to contribute make sure you include tests for your change, and that
existing tests don't break.
