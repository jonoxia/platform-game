// TODO zoom function!!

function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.7;
    TheWorld.canvasHeight = screenHeight * 0.7;

    $("#design-canvas").attr("width", TheWorld.canvasWidth);
    $("#design-canvas").attr("height", TheWorld.canvasHeight);

    $("#tools").css("max-width", screenWidth * 0.2);
    $("#tools").attr("max-width", screenWidth * 0.2);
    $("#tools").attr("width", screenWidth * 0.2);
    redraw();
}

function showhide(id) {
  $(".hidden-panel").css("display", "none");
  $("#" + id).css("display", "block");
}

function GenericPlacementTool(cons) {
    this._cons = cons;
    // TODO this class duplicates a ton of code from GenericRectangleTool;
    // factor that code out somehow.
}
GenericPlacementTool.prototype = {
    currentPlatform: null,
    mouseIsDown: false,
    startX: 0,
    startY: 0,

    onMouseDown: function(x, y) {
	var pt = worldCoords(x, y);
	this.currentPlatform = TheWorld.getPlatformAt(pt.x, pt.y);
	if (this.currentPlatform) {
	    // Already platform here? Start dragging it.
	    this.startX = pt.x - this.currentPlatform.left;
	    this.startY = pt.y - this.currentPlatform.top;
	}
	this.mouseIsDown = true;
    },

    onMouseMove: function(x, y) {
	if (this.mouseIsDown && this.currentPlatform != null) {
	    // if you're dragging something, drag it:
	    var pt = worldCoords(x, y);
	    this.currentPlatform.left = pt.x - this.startX;
	    this.currentPlatform.top = pt.y - this.startY;
	    redraw();
	} else {
	    // Otherwise draw a box to preview where the object
	    // will be added on a click
	    redraw();
	    var context = $("#design-canvas")[0].getContext("2d");
	    context.strokeStyle = "black";
	    context.strokeRect(x, y,
			       this._cons.prototype.width,
			       this._cons.prototype.height);
	}
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	if (!this.currentPlatform) {
	    // Construct instance at this point, add it to TheWorld
	    var cons = this._cons;
	    var loader = new AssetLoader();
	    var obj = new cons(loader);
            loader.loadThemAll( function() {
	      obj.boxInit(Math.floor(pt.x), Math.floor(pt.y),
		          cons.prototype.width, cons.prototype.height);
              TheWorld.addForegroundObject(obj);
	    });
	}
	this.currentPlatform = null;
	this.mouseIsDown = false;
    }
};

function GenericRectangleTool(cons) {
    // pass in a constructor for the class that this tool will create
    this._cons = cons;
}
GenericRectangleTool.prototype = {
    currentPlatform: null,
    mouseIsDown: false,
    startX: 0,
    startY: 0,

    defineRect: function(x, y) {
	var left, top, width, height;
	if (x < this.startX) {
	    left = x;
	    width = this.startX - x;
	} else {
	    left = this.startX;
	    width = x - this.startX;
	}
	if (y < this.startY) {
	    top = y;
	    height = this.startY -y
	} else {
	    top = this.startY;
	    height = y - this.startY;
	}
	return {l: Math.floor(left), t: Math.floor(top),
		w: Math.floor(width), h: Math.floor(height)};
    },

    onMouseDown: function(x, y) {
	var pt = worldCoords(x, y);
	this.currentPlatform = TheWorld.getPlatformAt(pt.x, pt.y);
	if (this.currentPlatform) {
	    // Already platform here? Start dragging it.
	    this.startX = pt.x - this.currentPlatform.left;
	    this.startY = pt.y - this.currentPlatform.top;

	} else {
	    // No platform here? Start creating one.
	    this.startX = pt.x;
	    this.startY = pt.y;
	}
	this.mouseIsDown = true;
    },

    onMouseMove: function(x, y) {
	if (this.mouseIsDown) { // TODO factor this out?
	    var pt = worldCoords(x, y);
	    if (this.currentPlatform != null) {
		this.currentPlatform.left = pt.x - this.startX;
		this.currentPlatform.top = pt.y - this.startY;
		redraw();
	    } else {
		redraw();
		// draw preview (screen coordinates!)
		var rect = this.defineRect(pt.x, pt.y);
		var context = $("#design-canvas")[0].getContext("2d");
		context.strokeStyle = "black";
		context.strokeRect(TheWorld.worldXToScreenX(rect.l),
				   TheWorld.worldYToScreenY(rect.t),
				   rect.w, rect.h);
	    }
	}
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	if (!this.currentPlatform) {
	    var rect = this.defineRect(pt.x, pt.y);
	    // Construct instance, add it to TheWorld
	    var plat = new this._cons();
	    plat.boxInit(rect.l, rect.t, rect.w, rect.h);
	    TheWorld.addForegroundObject(plat);
	}
	this.currentPlatform = null;
	this.mouseIsDown = false;
    }
};

var EraserTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	var plat = TheWorld.getPlatformAt(pt.x, pt.y);
	if (plat) {
	    TheWorld.removeForegroundObject(plat);
	}
    }
};

var ScrollTool = {
    lastX: 0,
    lastY: 0,
    mouseIsDown: false,
    onMouseDown: function(x, y) {
	this.mouseIsDown = true;
	this.lastX = x;
	this.lastY = y;
    },

    onMouseMove: function(x, y) {
	if (this.mouseIsDown) {
	    TheWorld.xOffset -= (x - this.lastX);
	    TheWorld.yOffset -= (y - this.lastY);
	    this.lastX = x;
	    this.lastY = y;
	    redraw();
	}
    },

    onMouseUp: function(x, y) {
	this.mouseIsDown = false;
    }
};

var StartTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	TheWorld.startX = pt.x;
	TheWorld.startY = pt.y;
    }
};

var GoalTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	TheWorld.goalArea.setBounds(pt.x, pt.y, 64, 64);
    }
};

var g_selectedTool = ScrollTool;

function canvasCoords(evt) {
    var xOffset = $("#design-canvas").offset().left;
    var yOffset = $("#design-canvas").offset().top;
    return {x: evt.pageX - xOffset,
	    y: evt.pageY - yOffset};
}

function worldCoords(x, y) {
    return {x: TheWorld.screenXToWorldX(x),
	    y: TheWorld.screenYToWorldY(y)};
}

function redraw() {
    var context = $("#design-canvas")[0].getContext("2d");
    TheWorld.draw(context);
    // mark start location, since world doesn't draw it:
    context.strokeStyle = "black";
    var x = TheWorld.worldXToScreenX(TheWorld.startX);
    var y = TheWorld.worldYToScreenY(TheWorld.startY);
    context.strokeRect(x, y, 64, 64);
    context.font="10pt arial";
    context.strokeText(getLocalString("_start"), x + 5, y +32);
}

function saveChanges() {
    // AJAX Post json data to save-level.py
    var URL = "save-level.py";

    var title = gup("level");
    var i, objs;
    var allData = {};
    var worldData = [];
    // Add all foreground and background objects:
    objs = TheWorld.foregroundObjects;
    for (i = 0; i < objs.length; i++) {
	worldData.push({ x: objs[i].left,
		    y: objs[i].top,
		    width: objs[i].width,
		    height: objs[i].height,
		    type: objs[i].type});
    }
    objs = TheWorld.backgroundObjects;
    for (i = 0; i < objs.length; i++) {
	worldData.push({ x: objs[i].left,
		    y: objs[i].top,
		    width: objs[i].width,
		    height: objs[i].height,
		    type: objs[i].type});
    }
    // Add goal area:
    var goal = TheWorld.goalArea;
    worldData.push({ x: goal.left, y: goal.top, width: goal.width, height: goal.height,
		type: "goal"});
    allData.worldData = worldData;
    // Add starting point:
    allData.startX = TheWorld.startX;
    allData.startY = TheWorld.startY;
    // BG image and other URLs:
    allData.bgUrl = $("#level-bg-url").val();
                      // TODO don't hard-code this stuff here:
    allData.tilesetUrl = JSON.stringify({ "platform-img-url": $("#platform-img-url").val(),
					  "trinket-img-url": $("#trinket-img-url").val()
                                        });
    allData.musicUrl = $("#level-music-url").val();
    allData.goalUrl = $("#level-goal-url").val();
    // Physics modifications:

    allData.physicsConsts = {};
    for (var prop in PhysicsConstants) {
	var fieldVal = parseInt($("#" + prop).val());
        allData.physicsConsts[prop] = isNaN(fieldVal) ?
	    PhysicsConstants[prop] : fieldVal;
    }
    allData.published = $("#publish").attr("checked") ? "true":"false";

    $.ajax({type: "POST",
            url: URL,
	    data: {levelName: title,
		   levelData: JSON.stringify(allData)},
	    success: function(data, textStatus, jqXHR) {
		$("#debug").html(data);
	    },
	    error: function(data, textStatus, thing) {
		$("#debug").html(thing);
	    },
	    dataType: "text"
	    });
    $("#debug").html(JSON.stringify(allData));
    $("#debug").html("Saving, don't close the page..."); // TODO l10n
}

function makeFancyButton(constructorName) {
  // TODO instead of using constructorName as the name, use a localized description
  // TODO images for the scroll, startloc, and eraser tools?
  var cons = ConstructorRegistry.getConstructor(constructorName);
  var proto = cons.prototype;
  var minicanvas = $("<canvas></canvas>");
  var width = proto.width ? proto.width: 64;
  var height = proto.height ? proto.height: 64;
  minicanvas.attr("width", width);
  minicanvas.attr("height", height + 20);
  minicanvas.attr("class", "fancybutton");

  // Create a tool that creates instances using the constructor:
  // if the prototype specifies a default width and height,
  // then use a fixed-size placement tool; if its width and height
  // are variable, use a rectangle tool.
  var myTool = cons.prototype.hasOwnProperty("width") ?
    new GenericPlacementTool(cons) : new GenericRectangleTool(cons);

  // TODO draw the selected minicanvas differently!
  minicanvas.click(function() {
    g_selectedTool = myTool;
    $(".fancybutton").removeClass("selected");
    minicanvas.addClass("selected");
  });
  // Put the tool into either the monster, obstacle, or powerup category, according to its
  // classification
  var container;
  switch(proto.classification) {
    case "monster":
      container = $("#more-monster-tools");
    break;
    case "obstacle":
      container = $("#more-obstacle-tools");
      break;
    case "powerup":
      container = $("#more-powerup-tools");
      break;
  default:
    container = $("#more-tools");
    break;
  }
  container.append(minicanvas);
  // let's try drawing that sucker
  var loader = new AssetLoader();
  var ctx = minicanvas[0].getContext("2d");
  var obj = new cons(loader);
  loader.loadThemAll( function() {
    obj.boxInit(0, 0, width, height);
    obj.draw(ctx);
    ctx.strokeText(constructorName, 0, height + 16);
  });
}

$(document).ready(function() {
  var title = gup("level");

  // Handle mouseclicks on canvas according to selected tool:
  $("#design-canvas").bind("mousedown", function(evt) {
    var pos = canvasCoords(evt);
    g_selectedTool.onMouseDown(pos.x, pos.y);
  });
  $("#design-canvas").bind("mousemove", function(evt) {
    var pos = canvasCoords(evt);
    g_selectedTool.onMouseMove(pos.x, pos.y);
  });
  $("#design-canvas").bind("mouseup", function(evt) {
    var pos = canvasCoords(evt);
    g_selectedTool.onMouseUp(pos.x, pos.y);
    redraw();
  });

  // Create tools for all the object constructors we know about
  var names = ConstructorRegistry.listNames();
  for (var i = 0; i < names.length; i++) {
    makeFancyButton(names[i]);
  }

  // When you change the selected radio button, change the tool:
  $("input").change(function() {
    var id = $("input[@name=testGroup]:checked").attr('id');
    switch (id) {
    case "eraser-tool":
      g_selectedTool = EraserTool;
      break;
    case "scroll-tool":
      g_selectedTool = ScrollTool;
      break;
    case "start-tool":
      g_selectedTool = StartTool;
      break;
    case "goal-tool":
      g_selectedTool = GoalTool;
      break;
    }
  });

  var loader = new AssetLoader();
  var progressBar = new ProgressBar($("#design-canvas")[0].getContext("2d"));
  progressBar.draw(0);

  var startEditing = function() {
    progressBar.draw(0.5);
    $("#level-bg-url").val(TheWorld.bgUrl);

    $("#level-goal-url").val(TheWorld.goalUrl);
    $("#level-music-url").val(TheWorld.musicUrl);

    if (TheWorld.tileset) {
	var tileUrls = JSON.parse(TheWorld.tileset);
	for (var name in tileUrls) {
	    $("#" + name).val(tileUrls[name]);
	}
    }

    for (var prop in PhysicsConstants) {
	$("#" + prop).val( PhysicsConstants[prop] );
    }

    if (TheWorld.published) {
      $("#publish").attr("checked", "checked");
    }

    loader.loadThemAll(
      function() {
        var resizeTimer = null;
        adjustToScreen();
        $(window).resize(function() {
          if (resizeTimer) {
            clearTimeout(resizeTimer);
          }
          resizeTimer = setTimeout(adjustToScreen, 500);
        });
      },
      function(progress) {
        progressBar.draw(0.5 + 0.5 * progress);
      });
  };

  // Playing online or offline?
  if (typeof offlineLevelData != "undefined") {
    TheWorld.loadFromString(offlineLevelData, loader, startEditing);
  } else {
    TheWorld.loadFromServer(title, loader, startEditing);
  }

});