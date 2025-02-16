#!/usr/bin/env bash

mkdir -p ./dist
zip -r -FS ./dist/pixiv-quick-tag.xpi ./* --exclude ./README.md ./.gitignore ./build.sh ./dist/
