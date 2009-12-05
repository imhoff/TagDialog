#!/bin/sh

ZIP=zip
JAR=tagDialog.jar
VERSION=1.0.3

# make jar
(cd chrome; zip ${JAR} -r content locale skin;)

zip -1 tagDialog-${VERSION}.xpi \
	chrome \
	chrome/${JAR} \
	chrome.manifest \
	defaults \
	defaults/preferences \
	defaults/preferences/tagdialog.js \
	install.rdf \
	license.txt

