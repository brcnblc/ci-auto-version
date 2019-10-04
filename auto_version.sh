#!/bin/sh

while [ "$1" != "" ]
do
   args=$args' '$1
   shift
done

node ./node_modules/ci-auto-version/auto_version.js $args