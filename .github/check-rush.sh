#!/bin/bash

echo Checking for newly inrtoduced dependency mismatches


diff <(rush check --json |
    grep -A5000 -m1 -e '^$'|
    tail -n +5 |
    jq) .github/version-check-status.json && exit 0

echo Mismatches found. 
echo Run \"rush check\" to confirm they were intended and update
echo the versioned checked file with
echo rush check --json \| grep -A5000 -m1 -e '^$'\|tail -n +5 \| jq  \> .github/version-check-status.json
