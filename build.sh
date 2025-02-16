#!/usr/bin/env bash

mkdir -p ./dist
zip -r -FS ./dist/pixiv-quick-tag.zip ./* --exclude ./.gitignore ./build.sh ./dist/
