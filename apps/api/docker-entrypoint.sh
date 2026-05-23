#!/bin/sh
set -eu

if [ -d /host_ssh ]; then
  rm -rf /tmp/blog_ssh
  mkdir -p /tmp/blog_ssh
  cp -R /host_ssh/. /tmp/blog_ssh/ 2>/dev/null || true
  chmod 700 /tmp/blog_ssh
  find /tmp/blog_ssh -type f -name "id_*" ! -name "*.pub" -exec chmod 600 {} \; 2>/dev/null || true
  find /tmp/blog_ssh -type f -name "*.pub" -exec chmod 644 {} \; 2>/dev/null || true
  find /tmp/blog_ssh -type f -name "known_hosts*" -exec chmod 644 {} \; 2>/dev/null || true
fi

exec "$@"
