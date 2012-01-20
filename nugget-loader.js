
function testCode() {
    var code = $("#code-input").val();
    try {
	var filename = "blarg";
        var f = new Function("require", "exports", "module", code);
	var context = {};
	var exports = {};
	var module = {id: "blarg", uri: filename};
	f.call(context, require, exports, module);
	var monster = exports.monster;

        //DefineEnemy(testmodule.monster);*/
	/*var monster = require("nugget.py?id=3").monster;*/
	$("#debug").html( "Blarg: " + monster.name);
        $("#img-preview").attr("src", monster.imageUrl);
    }
    catch(x) {
	$("#debug").html("Error: " + x);
    }
}

// Need to modify require.js so that it loads from URLs (done)
// Then we can require urls like nugget.py?id=x
// next, when you save a nugget it should extract name, type, and image from the code you put in
// (if it can't extract those, then saving it is invalid!)

// Then, in the level editor, generate options menu using the METADATA from every VALID code nugget.
// When one of these things is used in the level, it saves a LevelObject using the FULLY QUALIFIED name, i.e.
// URL#entity
// When loading a level for play, hitting any LevelObject with a # in its type triggers 
// something like a 
// nugget = require(url);
// if (nugget.monster) {
//   DefineEnemy(nugget.monster);
// }
// if (nugget.powerup) {
//   DefinePowerUp(nugget.powerup);
// }
// etc.


// The level needs to have a list of URLs that it is gonna try to include?
// Or we try to include ALL nuggets and just leave out the ones that raise exceptions?


function saveCode() {
    var url = "nugget-editor.py"
    $.ajax({type: "POST", 
        url: url,
        data: {"id": $("#nugget-id").attr("value"),
               "nugget-name": $("#nugget-name").val(),
               "nugget-type": $("#nugget-type").val(),
               "code-input": $("#code-input").val()
               }, 
        success: function(data, textStatus, jqXHR) {
            $("#debug").html(data);
        },
        error: function(data, textStatus, thing) {
            $("#debug").html(thing);
        },
        dataType: "text"
    });
}

function loadCode() {
    var url = "nugget.py"
    $.get(url, {id: nuggetId}, function(data, textStatus, jqXHR) {
        $("#code-input").val(data);
    }, "html");
}
