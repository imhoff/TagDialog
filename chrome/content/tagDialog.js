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

/** Tag Dialog Version */
const version = '1.0.4';
/** alias Components.classes */
const Cc = Components.classes;
/** alias Components.interfaces */
const Ci = Components.interfaces;

/** initial tag keys with space demiliter */
var initialTags = window.arguments[0];
/** {<br>status:{Bool},<br>existingTags:{Object},<br>newTagKeys:{Object}<br>} */
var result = window.arguments[1];
/** URI of current selected root folder */
var folderURI = window.arguments[2];

var hdrMsg = window.arguments[3];

/**
 * dialog controller
 * @see chrome://tagdialog/content/tagDialog.xul
 */
var tagDialog = {
    prefService : Cc['@mozilla.org/preferences-service;1']
                    .getService(Ci.nsIPrefService)
                    .getBranch("extensions.tagdialog."),
    /**
     * nsIMsgTagService
     * @see http://lxr.mozilla.org/mailnews/ident?i=nsMsgTagService
     */
    tagService : Cc['@mozilla.org/messenger/tagservice;1'].getService(Ci.nsIMsgTagService),
    /** All tag array */
    tagArray : [],
    /** XUL_Element tag list group */
    tagListGroupBox : null,
    /** XUL_Element vbox */
    tagListBox : null,
    /**
     * XUL_Element textbox<br>
     * User will input tag list in this Element.
     */
    tagTextBox : null,
    /**
     * XUL_Element hbox<br>
     * Complementable tag list will be created in this Element.
     * @see tagDialog.nominated
     */
    nominatedTagBox : null,
    /**
     * RegExp Object<br>
     * This is used by search for tags matched.
     */
    reg : new RegExp(),
    /**
     * Matching tag case insensitive
     */
    caseInsensitive : true,
    /**
     * default demiliter string of tags list
     */
    demiliter : ',',
    ignoredTags : null,
    
    /**
     * initialize method
     * @param {String[]} _tags
     */
    init : function( _tags ){
        document.title = document.title + ' ' + version;
        if ( this.prefService.prefHasUserValue('demiliter') ){
            this.demiliter = this.prefService.getCharPref('demiliter');
        }
        if ( this.prefService.prefHasUserValue('case_insensitive') ){
            this.caseInsensitive = this.prefService.getBoolPref('case_insensitive');
        }
        this.tagArray = this.tagService.getAllTags({});
        this.tagListGroupBox = document.getElementById('tagListGroup');
        this.tagListBox = document.getElementById('tagList');
        this.tagTextBox = document.getElementById('tagText');
        this.nominatedTagBox = document.getElementById('nominatedTags');
        this.buildTags();
        this.ignoredTags = decodeURIComponent(escape(this.prefService.getCharPref('ignored_tags'))).split('\n');
        if ( _tags ){
            this.tagTextBox.value = '';
            for ( var i=0; i<_tags.length; i++ ){
                if ( _tags ) this.tagTextBox.value += _tags[i] + this.demiliter;
            }
        } else if ( initialTags ){
            var keys = initialTags.split(' ');
            var tags = [];
            for ( var i=0; i<keys.length; i++ ){
                var tagName;
                try {
                    tagName = this.tagService.getTagForKey(keys[i]);
                }
                catch(e) {
                    // Undefined tags possibly appear on IMAP.
                    tagName = this.generateTagNameForKey(keys[i]);
                    if (this.ignoredTags.indexOf(tagName) > -1) continue;
                }
                if ( tagName ){
                    var checkbox = document.getElementById('tag_'+keys[i]);
                    if (checkbox) checkbox.checked = true;
                    tags.push(tagName);
                }
            }
            if (tags.length)
                this.tagTextBox.value = tags.join(this.demiliter) + this.demiliter;
        }
        this.tagTextBox.addEventListener('input',function(){
            if ( ! this.value ) return;
            tagDialog.update();
        },false);
        this.tagTextBox.addEventListener('keydown',function(){
            var evt = arguments[0];
            tagDialog.onKeyDown( evt );
            evt.stopPropagation();
        },true);
        this.tagListGroupBox.addEventListener('command',tagDialog.toggleCheck,true);
        this.popup.init();
        this.tagTextBox.focus();
    },
    generateTagNameForKey : function( _key ){
        var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
        converter.charset = 'x-imap4-modified-utf7';
        return converter.ConvertToUnicode(_key);
    },
    /**
     * called by input event
     */
    update : function(){
        var tagWords = this.tagTextBox.value.split( this.demiliter );
        var tagIndexOfCaret = this.getArrayIndexByLength(tagWords);
        this.nominated.reset();
        for ( var i=0; i<this.tagArray.length; i++){
            document.getElementById('tag_'+this.tagArray[i].key).checked = false;
        }
        for ( var i=0; i<tagWords.length; i++ ){
            if ( ! tagWords[i] ) continue;
            var matchedTags = this.getTagArrayByMatch( tagWords[i] );
            if ( matchedTags.length > 0 && matchedTags[0].tag == tagWords[i] ){
                document.getElementById('tag_' + matchedTags[0].key).checked = true;
                if ( matchedTags.length == 1 ) continue;
            }
            if ( i != tagIndexOfCaret ) continue;
                this.nominated.add( matchedTags );
        }
    },
    /**
     * toggle checkbox<br>
     * call by oncommand event
     * @param {event} _evt
     */
    toggleCheck: function( _evt ){
        if ( _evt.target.localName != 'checkbox' ) return;
        var tagName = _evt.target.label;
        var tags = tagDialog.getTagListFromTextBox();
        if ( _evt.target.checked ){
            tags.push( tagName );
            tagDialog.tagTextBox.value = tags.join(tagDialog.demiliter) + tagDialog.demiliter;
        } else {
            var value = [];
            for ( var i=0; i<tags.length; i++){
                if ( tags[i] == tagName ) continue;
                value.push( tags[i] );
            }
            tagDialog.tagTextBox.value = value.join(tagDialog.demiliter) + tagDialog.demiliter;
        }
        tagDialog.tagTextBox.focus();
    },
    /**
     * commit
     */
    commit : function(){
        var tags = this.tagTextBox.value.split( this.demiliter );
        for ( var i=0; i<tags.length; i++ ){
            var isNewTag = true;
            if ( ! tags[i] ) continue;
            for ( var k=0; k<this.tagArray.length; k++){
                if( tags[i].toLowerCase() == this.tagArray[k].tag.toLowerCase() ){
                    result.existingTags.push( this.tagArray[k] );
                    isNewTag = false;
                    break;
                }
            }
            if ( isNewTag ) {
                if ( this.prefService.getBoolPref('ask_newtag') ){
                    var args = {
                         status: false,
                         edit: false,
                         tagName: tags[i],
                         tagColor: this.prefService.getCharPref('default_color')
                    };
                    var daialog = openDialog('chrome://tagdialog/content/editTag.xul',
                                             'addTag',
                                     'chrome,titlebar,modal,centerscreen',
                                     args);
                    if ( args.status ){
                        try {
                            this.tagService.addTag( args.tagName, args.tagColor, '' );
                          result.newTagKeys.push( this.tagService.getKeyForTag(args.tagName) );
                        } catch (e){
                            alert(e);
                        }
                    } else {
                        return false;
                    }
                } else {
                    this.tagService.addTag( tags[i], '', '' );
                    result.newTagKeys.push( this.tagService.getKeyForTag(tags[i]) );
                }
            }
        }
        result.status = true;
        return true;
    },
    /**
     * cancel
     */
    cancel : function(){
        return true;
    },
    /**
     * called by keydown event
     * @param {Event} evt keydown event object
     */
    onKeyDown: function( evt ){
        switch ( evt.keyCode ){
        case evt.DOM_VK_RETURN:
            if( evt.ctrlKey ){
                if ( this.nominated.counts > 0 ){
            this.complementTagText();
                } else {
                    this.update();
                }
            }
            break;
        case evt.DOM_VK_RIGHT:
        case evt.DOM_VK_DOWN:
        case evt.DOM_VK_N:
            if ( evt.ctrlKey ){
                if ( this.nominated.counts > 0 ){
                    this.nominated.forward();
                } else {
                    this.update();
                }
            }
            break;
        case evt.DOM_VK_LEFT:
        case evt.DOM_VK_UP:
        case evt.DOM_VK_P:
            if ( evt.ctrlKey ){
                if ( this.nominated.counts > 0 ){
                    this.nominated.backward();
                } else {
                    this.update();
                }
            }
            break;
        }
    },
    /**
     * tag all clear
     */
    allClear : function(){
        this.tagTextBox.value = '';
        this.tagTextBox.focus();
    },
    /**
     * complement tag text in the text box<br>
     * テキストボックス内のタグ補完
     */
    complementTagText : function(){
        var tags = this.getTagListFromTextBox();
        var tagIndex = this.getArrayIndexByLength( tags );
        tags[tagIndex] = this.nominated.tags[this.nominated.currentIndex].tag.tag;
        this.tagTextBox.value = tags.join( this.demiliter ) + this.demiliter;
        setTimeout(function(){tagDialog.tagTextBox.focus();},0);
        this.tagTextBox.selectionStart = this.tagTextBox.selectionEnd;
        this.update();
    },
    /**
     * return index of array at caret place of the text box<br>
     * テキストボックス内のカーソル位置にある配列番号を返す
     * @param {String[]} _array tags list
     * @return {Number}
     */
    getArrayIndexByLength : function( _array ){
        var caret = this.tagTextBox.selectionStart;
        var delimiterLengh = this.demiliter.length;
        var currentLengh = 0;
        for ( var i=0; i<_array.length; i++ ){
            currentLengh += _array[i].length;
            if ( currentLengh >= caret ) {
                return i;
            }
            currentLengh += delimiterLengh;
        }
        return _array.length;
    },
    /**
     * getTagListFromTextBox
     * @return {String[]}
     */
    getTagListFromTextBox : function(){
        var list = this.tagTextBox.value.split( this.demiliter );
        var tags = [];
        for ( var i=0; i<list.length; i++){
            if ( list[i] == '' ) continue;
            tags.push( list[i] );
        }
        return tags;
    },
    /**
     * create tag list
     * @see chrome://tagdialog/content/tagDialog.xul id:tagList
     */
    buildTags : function(){
        while ( this.tagListBox.hasChildNodes() ){
            this.tagListBox.removeChild( this.tagListBox.firstChild );
        }
        var i = 0;
        var step = 6;
        var length = this.tagArray.length;
        while ( i < length ){
            var hbox = createElement('hbox');
            var k=0;
            while ( k++ < step && i < length ){
                /*
                var button = createElement('label',{
                    value: this.tagArray[i].tag,
                    id: 'tag_' + this.tagArray[i].key
                },null);
                */
                var button = createElement('checkbox',{
                  label: this.tagArray[i].tag,
                  id: 'tag_' + this.tagArray[i].key
                },null);
                if (i < 9){
                    button.setAttribute('accesskey',i+1)
                } else if (i < 34){
                    button.setAttribute('accesskey',String.fromCharCode(i+56))
                }
                button.style.color = this.tagArray[i].color;
                hbox.appendChild(button);
                i++;
            }
            this.tagListBox.appendChild(hbox);
        }
    },
    /**
     * return array matched argument string
     * @param {String} _word
     * @return {Array}
     */
    getTagArrayByMatch : function( _word ){
        if ( ! _word ) return this.tagArray;
        this.reg.compile('^' + _word , this.caseInsensitive ? 'i' : '');
        return this.tagArray.filter(isMatch, this.reg);
        /**
         * Array.filter callback function<br>
         * Test each element of the array.
         * @param {Object} element 
         * @param {Number} index
         * @param {Array} array
         * @return {Boolean}
         * @see http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
         */
        function isMatch( element, index, array ){
            return this.test(element.tag);
        }
    }
};

/**
 * Nominated Tags List Controler
 * @see chrome://tagdialog/content/tagDialog.xul#<b>nominatedTags</b>
 */
tagDialog.nominated = {
    /** Nominated tags list*/
    tags : [],
    /** Number of tags nominated */
    counts : 0,
    /** Array index of current focused */
    currentIndex : 0,
    /**
     * Add tag nominated<br>
     * Create label Element and add into the Element of id:nominatedTags
     * @param {nsIMsgTag[]} _tags
     */
    add : function ( _tags ){
        for ( var i=0; i<_tags.length; i++){
        this.counts++;
        var label = createElement('label',{ value : _tags[i].tag },null);
        if ( this.counts == 1 ){
            label.style.color = 'HighLightText';
            if ( _tags[i].color ){
                label.style.backgroundColor = _tags[i].color;
            } else {
                label.style.backgroundColor = 'HighLight';
            }
        } else {
            label.style.color = _tags[i].color;
        }
        tagDialog.nominatedTagBox.appendChild( label );
        this.tags.push( { tag: _tags[i], element: label } );
        }
    },
    /**
     * Reset nominated list<br>
     * Reset couts and remove Elements
     */
    reset : function(){
        this.tags = [];
        this.counts = 0;
        this.currentIndex = 0;
        while( tagDialog.nominatedTagBox.hasChildNodes() ){
            tagDialog.nominatedTagBox.removeChild( tagDialog.nominatedTagBox.firstChild );
        }
    },
    /**
     * Focus next nominated Element
     */
    forward : function(){
        if ( this.counts == 0 ) return;
        this.focus( this.tags[this.currentIndex], false );
        this.currentIndex++;
        if ( this.currentIndex == this.counts ){
            this.currentIndex = 0;
        }
        this.focus( this.tags[this.currentIndex], true );
    },
    /**
     * Focus previous nominated Element
     */
    backward : function(){
        if ( this.counts == 0 ) return;
        this.focus( this.tags[this.currentIndex], false );
        this.currentIndex--;
        if ( this.currentIndex == -1 ){
            this.currentIndex = this.counts -1;
        }
        this.focus( this.tags[this.currentIndex], true );
    },
    /**
     * Focus or defocus the tag<br>
     * set style of text color and background color
     * @param {nsMsgTag} _tag
     * @param {Boolean} _bool if true then Focus else Defocus
     */
    focus : function( _tag, _bool ){
        if ( _bool ){
            _tag.element.style.color = 'HighLightText';
            _tag.element.style.backgroundColor = _tag.tag.color ? _tag.tag.color : 'HighLight';
        } else {
            _tag.element.style.color = _tag.tag.color;
            _tag.element.style.backgroundColor = 'transparent';
        }
    }
};
/**
 * popup controller
 */
tagDialog.popup = {
    /**
     * target of oncontextmenu
     */
    target : null,
    msgWindow: Cc["@mozilla.org/messenger/msgwindow;1"].createInstance(Ci.nsIMsgWindow),
    init : function(){
        document.getElementById('tagListGroup').addEventListener('contextmenu',tagDialog.popup.show,true);
    },
    show : function( _evt ){
        var observer = document.getElementById('onMouseCheckBox');
        var templateFilter = document.getElementById('menu_createFilterWithTemplate')
        if ( _evt.target.localName == 'checkbox' ){
            tagDialog.popup.target = _evt.target;
            observer.removeAttribute('disabled');
            templateFilter.setAttribute('label', 'Filter: ' + _evt.target.label);
            templateFilter.removeAttribute('hidden');
        } else {
            observer.setAttribute('disabled','true');
            templateFilter.setAttribute('hidden','true');
            tagDialog.popup.target = null;
        }
    },
    /**
     * Show popup option dialog
     */
    showOption : function(){
        var dialog = openDialog('chrome://tagdialog/content/tagDialogPreference.xul');
        var tags = tagDialog.tagTextBox.value.split(tagDialog.demiliter);
        tagDialog.init(tags);
    },
    tagEdit : function(){
        var args = {
            status : false,
            edit : true,
            tagName : this.target.label,
            tagColor : this.target.style.color
        };
        var dialog = openDialog('chrome://tagdialog/content/editTag.xul',
                                'editTag',
                                'chrome,titlebar,modal,centerscreen',
                                args);
      if ( args.status ){
        var tagKey = this.target.id.substring(4);
        tagDialog.tagService.setTagForKey( tagKey, args.tagName );
        this.target.label = args.tagName;
        if ( args.tagColor ){
            tagDialog.tagService.setColorForKey( tagKey, args.tagColor );
            this.target.style.color = args.tagColor;
        }
      }
    },
    tagDelete : function(){
        var tagKey = this.target.id.substring(4);
        tagDialog.tagService.deleteKey( tagKey );
        this.target.parentNode.removeChild( this.target );
    },
    tagCopy : function(){
        var clipboard = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);
        clipboard.copyString(this.target.label);
    },
    /**
     * openFilterDialog
     * @param {Element} aTarget
     * @param {Boolean} templateFlag
     */
    openFilterDialog: function(aTarget, templateFlag){
        var currentFilterList = hdrMsg.folder.getFilterList(this.msgWindow);
        /** daialog arguments */
        var args;
        var isNewFilter = false;
        if ((aTarget || this.target) && templateFlag){
            var filterName = (aTarget || this.target).label;
            var msgFilter = getExistingFilter(filterName);
            if (! msgFilter){
                msgFilter = currentFilterList.createFilter(filterName);
                /*
                 *  create and set term of filter
                 *  filterName is contain in Subject
                 */
                var term = msgFilter.createTerm();
                term.attrib = Ci.nsMsgSearchAttrib.Subject;
                term.op = Ci.nsMsgSearchOp.Contains;
                term.value = { attrib: term.attrib, str: filterName };
                msgFilter.appendTerm(term);
                /*
                 * create and set action of filter
                 * set the label of filterName
                 */
                var action = msgFilter.createAction();
                action.type = Ci.nsMsgFilterAction.AddTag;
                action.strValue = tagDialog.tagService.getKeyForTag(filterName);
                msgFilter.appendAction(action);
                // Insert msgFilter
                currentFilterList.insertFilterAt(0, msgFilter);
                isNewFilter = true;
            }
            args = { filter: msgFilter, filterList: currentFilterList };
        } else {
            args = { filterList: currentFilterList };
        }
        window.openDialog('chrome://messenger/content/FilterEditor.xul',
                          'FilterEditor',
                          'chrome,modal,titlebar,resizable,centerscreen',args);
        if ('refresh' in args && args.refresh){
            document.getElementById('menu_filterList').removeAttribute('ref');
            document.getElementById('menu_filterList').setAttribute('ref', folderURI);
            document.getElementById('tagDialogPopup').hidePopup();
        } else {
            if (isNewFilter) {
                currentFilterList.removeFilter(msgFilter);
            }
        }
        
        /**
         * getExistintFilter
         * @param {String} aFilterName
         * @return {nsIMsgFilter|false}
         */
        function getExistingFilter(aFilterName){
            for (var i=0; i<currentFilterList.filterCount; i++){
                if (aFilterName == currentFilterList.getFilterAt(i).filterName){
                    return currentFilterList.getFilterAt(i);
                }
            }
            return false;
        }
    },
    generateFilterList: function(){
        var popupElm = document.getElementById("filterPopup");
        var sep = document.getElementById("menu_separateFilter");
        while (sep.nextSibling){
            popupElm.removeChild(sep.nextSibling);
        }
        var filterList = hdrMsg.folder.getFilterList(this.msgWindow);
        for (var i=0, len=filterList.filterCount; i < len; i++){
            var filter = filterList.getFilterAt(i);
            var elm = createElement("menuitem", {
                label: filter.filterName,
                oncommand: "tagDialog.popup.openFilterDialog(this, true);"
            });
            popupElm.appendChild(elm);
        }
        return true;
    }
}
/**
 * create Element
 * @param {String} _tagName ElementTagName
 * @param {Object} _attrObj Attribute key and value
 * @param {String} _text    This will be TextNode
 * @return {Element}
 */
function createElement( _tagName, _attrObj, _text ){
    var elm = document.createElement(_tagName);
    if ( _attrObj ){
        for ( var attr in _attrObj ){
            elm.setAttribute(attr,_attrObj[attr]);
        }
    }
    if ( _text ){
        var text = document.createTextNode(_text);
        elm.appendChild( text );
    }
    return elm;
}
// vim: sw=4 ts=4 et:
