#!/bin/sh

# make the process a bit more verbose on each step
set -ex

# install and build shared files package
cd eisbuk-shared
yarn && yarn build
# create a global "eisbuk-shared" symlink
yarn link

# install "eisbuk-admin" app and include "eisbuk-shared" symlink
cd ../eisbuk-admin
yarn
yarn link eisbuk-shared

# install "functions" and include "eisbuk-shared" symlink
cd functions
yarn
yarn link eisbuk-shared
