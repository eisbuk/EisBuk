# install and build shared files package
cd eisbuk-shared
echo "Installing and building shared files..."
yarn && yarn build

# create a global "eisbuk-shared" symlink
yarn link

# install "eisbuk-admin" app and include "eisbuk-shared" symlink
echo "Installing eisbuk-admin..."
cd ../eisbuk-admin
yarn
yarn link eisbuk-shared

# install "functions" and include "eisbuk-shared" symlink
echo "Installing cloud functions..."
cd functions
yarn
yarn link eisbuk-shared
