#!/bin/sh

do_exit() {
    echo "There is no directory /home/codespace/ here!"
    echo "Are you sure this is a codespaces environment?"
    echo This is meant to be run in Github codespaces
    exit 1
}

[ -d /home/codespace/ ] || do_exit
echo '1' |sudo tee /proc/sys/net/ipv6/conf/lo/disable_ipv6 > /dev/null
echo '1' |sudo tee /proc/sys/net/ipv6/conf/all/disable_ipv6 > /dev/null
echo '1' |sudo tee /proc/sys/net/ipv6/conf/default/disable_ipv6 > /dev/null
echo IPV6 disabled - Now you can run firebase emulators in codespaces
