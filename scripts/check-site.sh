#!/bin/sh
# Run against the static server: sh scripts/check-site.sh http://127.0.0.1:4321
set -eu
base=${1:-http://127.0.0.1:4321}
for path in / /style.css /fonts/inter.woff2 /fonts/lora-italic.woff2 /favicon.ico /logo.png /sitemap.xml /robots.txt; do
  curl --fail --silent --show-error --output /dev/null "$base$path"
  printf 'OK %s\n' "$path"
done
for path in /about/ /writing/ /writing/hello-world/ /work-education/ /socials/ /banner.jpg /theme.js; do
  status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$base$path")
  if [ "$status" != 404 ]; then
    printf 'Expected 404, got %s: %s\n' "$status" "$path" >&2
    exit 1
  fi
  printf 'Removed %s\n' "$path"
done
