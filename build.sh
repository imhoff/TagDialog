#!/bin/sh

if [ -z "$1" ];then
  echo abort.
  exit 1
fi

XPI=$1

if [ -f $XPI ]; then
  rm $XPI;
fi

zip $XPI -r chrome defaults install.rdf chrome.manifest license.txt

echo ""
echo "Created: ${XPI}"

