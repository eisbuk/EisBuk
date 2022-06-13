#!/bin/sh
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

PACKAGE=$1
VERSION_FROM=$2
VERSION_TO=$3

# Check if any of PACKAGE or VERSION_FROM or VERSION_TO is empty
if [ -z "$PACKAGE" ] || [ -z "$VERSION_FROM" ] || [ -z "$VERSION_TO" ]; then
    echo "Usage: $0 <package> <version_from> <version_to>"
    echo "Example:"
    echo "$0 eslint-import-resolver-typescript ^2.4.0 ^2.7.1"
    exit 1
fi

if ! grep -q $PACKAGE\":\ \"$VERSION_FROM $script_dir/../packages/*/package.json ; then
    if ! grep -q $PACKAGE\":\ \" $script_dir/../packages/*/package.json ; then
        echo "Package $PACKAGE not found in packages"
        exit 1
    fi
    echo "Error: $VERSION_FROM of $PACKAGE not found in packages"
    grep -h $PACKAGE\":\ \" $script_dir/../packages/*/package.json|sort|uniq
    exit 1
fi

echo Replacing package $PACKAGE version $VERSION_FROM with $VERSION_TO

sed -i -e s\|$PACKAGE\":\ \"$VERSION_FROM\|$PACKAGE\":\ \"$VERSION_TO\| $script_dir/../packages/*/package.json
