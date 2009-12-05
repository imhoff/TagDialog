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
 * Dialog Argument
 * @member {Boolean} status
 * @member {String} tagName
 * @member {String} tagColor
 */
var args;
function initialize(){
	args = window.arguments[0];
	if ( args.edit ){
  	var title = document.getElementById("bundle_messenger").getString("editTagTitle");
  	document.title = title + ' - ' + args.tagName;
	} else {
  	document.title += ' - ' + args.tagName;
	}
	document.getElementById('tagText').value = args.tagName;
	document.getElementById('tagColor').color = args.tagColor;
}
/**
 * onAccept
 * @return {Boolean}
 */
function onOK(){
	args.tagName = document.getElementById('tagText').value;
	args.tagColor = document.getElementById('tagColor').color;
	args.status = true;
	return true;
}
/**
 * onCancel
 * @return {Boolean}
 */
function onCancel(){
	return true;
}