#!/usr/bin/env just --justfile

nuke:
  rm -rf node_modules packages/*/node_modules
