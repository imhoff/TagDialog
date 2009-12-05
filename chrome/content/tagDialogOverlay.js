/*
 * Lisence MPL 1.1/GPL 2.0/LGPL 2.1
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 * 
 * The Original Code is Tag Dialog.
 *
 * The Initial Developer of the Original Code is
 * teramako <teramako@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   teramako <teramako@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 */

/**
 * tagDialogObserver
 */
var tagDialogObserver = {
	initialize : function(){
    var observerService = Components.classes['@mozilla.org/observer-service;1']
                                    .getService(Components.interfaces.nsIObserverService);
    observerService.addObserver(tagDialogObserver,'mail:updateToolbarItems',false);
    window.removeEventListener('load',initializeTagDialog,false);
	},
	observe: function( aSubject, aTopic, aData ){
		try {
      if ( gDBView.keyForFirstSelectedMessage != nsMsgKey_None ){
      	document.getElementById('cmd_tagDialog').removeAttribute('disabled');
      }
		} catch (e){}
	}
};

function initializeTagDialog(){
	tagDialogObserver.initialize();
}
function popupTagDialog(){
	var gDBView = GetDBView();
	var msgHdr = gDBView.hdrForFirstSelectedMessage;
	var uri = getCurrentRootFolderURI();
	var currentKeys = msgHdr.getStringProperty('keywords');
	//if ( msgHdr.label ) currentKeys += ' $label' + msgHdr.label;
	var result = { status: false, existingTags: [], newTagKeys: [] };
	var dialog = window.openDialog('chrome://tagdialog/content/tagDialog.xul',
	                               'TagDialog',
	                               'chrome,titlebar,modal,resizable,centerscreen',
	                               currentKeys, result, uri);
  if ( result.status ){
  	RemoveAllMessageTags();
  	for ( var i=0; i<result.existingTags.length; i++ ){
    	ToggleMessageTag(result.existingTags[i].key, true);
  	}
  	for ( var i=0; i<result.newTagKeys.length; i++ ){
    	ToggleMessageTag(result.newTagKeys[i], true);
  	}
	}
}
function getCurrentRootFolderURI(){
	var gDBView = GetDBView();
	var uri = null;
	try {
		var rootFolder = gDBView.msgFolder.server.rootFolder;
		if (rootFolder.isServer && rootFolder.server.canHaveFilters){
			uri = (rootFolder.server.type == 'nntp') ? gDBView.msgFolder.URI : rootFolder.URI;
		}
	} catch (ex){
		Components.utils.reportError(ex);
	}
	return uri;
}
window.addEventListener('load',initializeTagDialog,false);
