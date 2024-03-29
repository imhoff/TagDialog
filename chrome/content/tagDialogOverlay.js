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
 * Portions created by the Initial Developer are Copyright (C) 2007-2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   teramako <teramako@gmail.com>
 *   SHIMODA Hiroshi <shimoda@clear-code.com / piro@p.club.ne.jp>
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

(function() {
    const TAGDIALOG_CMD = "cmd_tagDialog";
    const TAGDIALOG_CONTROLLER = {
        supportsCommand: function (aCommand) {
            return aCommand === TAGDIALOG_CMD;
        },
        isCommandEnabled: function (aCommand) {
            if (aCommand === TAGDIALOG_CMD) {
                return !!(gFolderDisplay.selectedMessage);
            }
            return false;
        },
        doCommand: function (aCommand) {
            if (aCommand !== TAGDIALOG_CMD)
                return;

            openTagDialog();
        },
        onEvent: function () {},
    };

    window.controllers.appendController(TAGDIALOG_CONTROLLER);

    function openTagDialog () {
        var gDBView = window.gDBView,
            msgHdr = gDBView.hdrForFirstSelectedMessage,
            uri = getCurrentRootFolderURI(),
            currentKeys = null,
            result = { status: false, existingTags: [], newTagKeys: [] };

        if (!msgHdr)
            return;

        currentKeys = msgHdr.getStringProperty('keywords');
        var dialog = window.openDialog('chrome://tagdialog/content/tagDialog.xul',
                                       'TagDialog',
                                       'chrome,titlebar,modal,resizable,centerscreen',
                                       currentKeys, result, uri, msgHdr);
        if ( result.status ){
            RemoveAllMessageTags();
            for (let i=0; i < result.existingTags.length; i++){
                ToggleMessageTag(result.existingTags[i].key, true);
            }
            for (let i=0; i < result.newTagKeys.length; i++){
                ToggleMessageTag(result.newTagKeys[i], true);
            }
        }
    }
    function getCurrentRootFolderURI () {
        var gDBView = window.gDBView,
            uri = null;
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
})();

// vim: sw=4 ts=4 et:
