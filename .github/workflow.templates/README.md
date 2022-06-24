# Templates for Github Actions

This directory contains the github actions definitions for this project.

They're compiled by the `build-workflows.sh` script.

The `ytt` tool is used to build the actual files.

[You can find the documentation for ytt here](https://carvel.dev/ytt/#example:example-load).

Each `*.yml` file that is not `*.lib.yml` will be compiled to a workflow file.

Reusable bits should live in `*.lib.yml` files.
