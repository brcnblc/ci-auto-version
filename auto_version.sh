#!/bin/sh

while [ "$1" != "" ]
do
   args=$args' '$1
   shift
done

node .devops/auto_version.js $args