#!/bin/bash

echo Checking for newly inrtoduced dependency mismatches

# remove newlines
diff -w <(rush check --json |
    grep -A5000 -m1 -e '^$'|
    tail -n +5 |
    jq -S . |
    tr --delete '\n' ) \
    <(tr --delete '\n' < .github/version-check-status.json)  > /dev/null && exit 0

# Print the diff again leaving the newlines in
diff -w <(rush check --json |
    grep -A5000 -m1 -e '^$'|
    tail -n +5 |
    jq -S . ) \
    .github/version-check-status.json  > /dev/null && exit 0

echo Mismatches found. 
echo Run \"rush check\" to confirm they were intended and update
echo the versioned checked file with
echo rush check --json \| grep -A5000 -m1 -e '^$'\|tail -n +5 \| jq -S . \> .github/version-check-status.json
exit 1
