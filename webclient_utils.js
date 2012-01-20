function gup( name )
{
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
	return "";
    else
	return unescape(results[1]);
}

function playSfx(tagId) {
    filename = $("#" + tagId).attr("src");
    var snd = new Audio(filename);
    snd.play();
}

// shim layer with setTimeout fallback
// Written by Paul Irish
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

var localized_strings = null;
function getLocalString(key) {
    // TODO How do we preload strings.json only once?
    // method 1 - XHR it when loading page (before asset loader?),
    // keep in memory
    // method 2 - embed strings.json in the page using templating,
    // read it out here.

    if (!localized_strings) {
	localized_strings = $("#localized_strings");
	if (!localized_strings) {
	    return "";
	}
	localized_strings = JSON.parse(localized_strings.html());
    }
    var str = localized_strings[key];
    if (str) {
	return str;
    } else {
	return "";
    }
}

function AssetLoader() {
    this._things = [];
    this._thingsToLoad = 0;
    this._thingsLoaded = 0;
}
AssetLoader.prototype = {
    add: function(url, type) {
	this._thingsToLoad++;
	var tag = new Image();
	var thing = { url: url,
	              tag: tag };
	this._things.push(thing);
	return tag;
    },

    loadThemAll: function(callback, updateFunc) {
	var self = this;
	// Edge case where nothing has been added - call callback immediately:
	if (this._thingsToLoad == 0) {
	    callback();
	    return;
	}
	for (var t = 0; t < this._thingsToLoad; t++) {
	    (function(thing) {
		thing.tag.onload = function() {
		    self._thingsLoaded ++;
		    if (updateFunc) {
			updateFunc( self._thingsLoaded / self._thingsToLoad );
		    }
		    if (self._thingsLoaded == self._thingsToLoad) {
			callback();
		    }
		};
		thing.tag.src = thing.url;
	    })(this._things[t]);
	}
    }
};