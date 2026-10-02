#!/bin/bash

# Regression test for deploy-firebase.expect (eisbuk/EisBuk#986): runs the wrapper
# against a fake `firebase` in a throwaway directory and checks its exit code and
# that packages/functions/package.json is put back. It never runs firebase-tools:
# `npx` itself is replaced by a shim that only knows the fake.
#
# Usage: common/scripts/test-deploy-firebase-expect.sh   (needs expect and bash)

set -u
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")"/../.. && pwd)
expect_bin=$(command -v expect) || { echo "expect is not installed"; exit 1; }
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/bin" "$work/packages/client" "$work/packages/functions"
cp "$repo_root/deploy-firebase.expect" "$work/"
cp "$repo_root/packages/functions/package.json" "$work/packages/functions/package.json"
cp "$work/packages/functions/package.json" "$work/package.json.orig"

cat > "$work/bin/npx" <<'EOF'
#!/bin/bash
# Shim: `npx firebase ...` -> the fake firebase below
[ "$1" = firebase ] || { echo "unexpected npx $*"; exit 99; }
shift
exec "$(dirname "$0")/fake-firebase" "$@"
EOF

cat > "$work/bin/fake-firebase" <<'EOF'
#!/bin/bash
# Like the functions predeploy hook, modify package.json first
sed -i.bak -e '/workspace:/d' ../functions/package.json && rm ../functions/package.json.bak
case "$FAKE_MODE" in
  complete)
    echo "Deploy complete!"; exit 0 ;;
  retry-complete|retry-then-delete)
    echo 'The following functions will newly be retried in case of failure: countSlotsBookings(europe-west6).'
    printf '? Would you like to proceed with deployment? (y/N) '
    read -r answer
    [ "$answer" = Y ] || { echo "got [$answer] instead of Y"; exit 9; }
    if [ "$FAKE_MODE" = retry-then-delete ]; then
      printf '? Would you like to proceed with deletion? (y/N) '
      read -r answer
      [ "$answer" = N ] || { echo "got [$answer] instead of N"; exit 9; }
    fi
    echo 'Deploy complete!'; exit 0 ;;
  unknown-deployment-prompt)
    printf '? Would you like to proceed with deployment? (y/N) '
    read -r answer
    exit 9 ;;
  prompt-complete|prompt-silent)
    printf '? Would you like to proceed with deletion? Selecting no will continue the rest of the deployments. (y/N) '
    read -r answer
    [ "$answer" = N ] || { echo "got [$answer] instead of N"; exit 9; }
    # prompt-silent is what firebase-tools 12.2.1 did on 2026-06-15: the first
    # function update was rejected, the deploy stopped and the CLI exited with 0
    [ "$FAKE_MODE" = prompt-complete ] && echo "Deploy complete!"
    exit 0 ;;
  silent)
    exit 0 ;;
  fail)
    echo "Error: There was an error deploying functions"; exit 2 ;;
  hang)
    while true; do echo "[debug] still working"; sleep 0.01; done ;;
  hang-ignoring-signals)
    trap '' TERM HUP INT
    while true; do echo "[debug] still working"; sleep 0.01; done ;;
  stopped)
    trap '' TERM HUP INT
    kill -STOP $$
    while true; do sleep 1; done ;;
esac
EOF
chmod +x "$work/bin/npx" "$work/bin/fake-firebase"

failures=0
check() { # check <mode> <expected exit code>
  local mode=$1 expected=$2 code
  cp "$work/package.json.orig" "$work/packages/functions/package.json"
  # A wrapper that deadlocks gets killed after 60s (exit code 137)
  (cd "$work" && FAKE_MODE=$mode DEPLOY_TIMEOUT=3 PATH="$work/bin:/usr/bin:/bin" \
    timeout --preserve-status -s KILL 60 "$expect_bin" -f ./deploy-firebase.expect > "$work/output-$mode.txt" 2>&1)
  code=$?
  if [ "$code" != "$expected" ]; then
    echo "FAIL $mode: exit code $code, expected $expected"; failures=$((failures + 1))
    sed 's/^/    /' "$work/output-$mode.txt" | tail -20
  elif ! cmp -s "$work/package.json.orig" "$work/packages/functions/package.json"; then
    echo "FAIL $mode: packages/functions/package.json was not restored"; failures=$((failures + 1))
  elif pgrep -f "$work/bin/fake-firebase" > /dev/null; then
    echo "FAIL $mode: the fake deploy is still running"; failures=$((failures + 1))
  else
    echo "ok   $mode: exit code $code, package.json restored"
  fi
  pkill -KILL -f "$work/bin/fake-firebase"
}

check complete 0
check prompt-complete 0
check retry-complete 0
check retry-then-delete 0
check unknown-deployment-prompt 1
check silent 1
check prompt-silent 1
check fail 2
check hang 124
check hang-ignoring-signals 124
check stopped 124

[ "$failures" = 0 ] || { echo "$failures failures"; exit 1; }
