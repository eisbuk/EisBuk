# Eisbuk CI

For CI, we're using GitHub actions (workflows). More detailed explanation comming soon...

## Quirks

### Rush commands

In order to run top level repo commands such as `rush` and `rushx`, as well as non-rush commands, i.e. `firebase`, we're not installing rush nor firebase globally, but are, rather using `common/scripts/run-install-rush.js` (and `rushx`/3rd party command equivalents). The mechanics of this feature are explained in more depth [here](https://rushjs.io/pages/maintainer/enabling_ci_builds/).

Additionally, rather than having to write the whole `node common/scripts/run-install-rush.js` each time we want to use `rush`, we've created somewhat of a command proxies named `rush`, `rushx`, etc. so that we can use the CLI as if we've installed rush globally.

```bash
# This way we can still do
rush update

# Instead of having to type
node common/scripts/rush-install-run.js update

# Both producting the same result
```

The proxy commands can be found in `common/scripts` and the dir needs to be added to `PATH` (which is done while setting up rush on each action workflow).
