#!/bin/sh

ZIP=zip
JAR=tagDialog.jar
VERSION=1.0.5

XPI=tagDialog-${VERSION}.xpi
# make jar
if [ -f "chrome/${JAR}" ];then
	rm chrome/${JAR}
fi
(cd chrome; zip ${JAR} -r content locale skin;)

if [ -f ${XPI} ];then
	rm ${XPI}
fi

zip -1 ${XPI} \
	chrome \
	chrome/${JAR} \
	chrome.manifest \
	defaults \
	defaults/preferences \
	defaults/preferences/tagdialog.js \
	install.rdf \
	license.txt


