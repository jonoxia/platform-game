
function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.7;
    TheWorld.canvasHeight = screenHeight * 0.7;

    $("#design-canvas").attr("width", TheWorld.canvasWidth);
    $("#design-canvas").attr("height", TheWorld.canvasHeight);
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
	    var obj = new this._cons();
	    obj.boxInit(Math.floor(pt.x), Math.floor(pt.y),
			this._cons.prototype.width, this._cons.prototype.height);
	    TheWorld.addForegroundObject(obj);
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
    context.strokeText("START", x + 5, y +32);
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
    allData.tilesetUrl = $("#level-tileset-url").val();
    allData.musicUrl = $("#level-music-url").val();
    allData.goalUrl = $("#level-goal-url").val();
    // Physics modifications:
    var gravity = parseInt($("#gravity").val());
    var acceleration = parseInt($("#acceleration").val());
    var topSpeed = parseInt($("#top-speed").val());
    var friction = parseInt($("#friction").val());
    var jumpPower = parseInt($("#jump-power").val());
    allData.physicsConsts = {
	gravity:  isNaN(gravity)? PhysicsConstants.gravity : gravity,
	acceleration: isNaN(acceleration) ? PhysicsConstants.acceleration : acceleration,
	topSpeed: isNaN(topSpeed)? PhysicsConstants.topSpeed : topSpeed,
	friction: isNaN(friction)? PhysicsConstants.friction : friction,
	jumpPower: isNaN(jumpPower)? PhysicsConstants.jumpPower : jumpPower
    };
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
    $("#debug").html("Saving, don't close the page...");
}

$(document).ready(function() {
  var title = gup("level");
  $("#play-this").attr("href", "play.py?level=" + title);
  adjustToScreen();


  // Handle mouseclicks on canvas according to selected tool:
  $("#design-canvas").bind("mousedown", function(evt) {
    pos = canvasCoords(evt);
    g_selectedTool.onMouseDown(pos.x, pos.y);
  });
  $("#design-canvas").bind("mousemove", function(evt) {
    pos = canvasCoords(evt);
    g_selectedTool.onMouseMove(pos.x, pos.y);
  });
  $("#design-canvas").bind("mouseup", function(evt) {
    pos = canvasCoords(evt);
    g_selectedTool.onMouseUp(pos.x, pos.y);
    redraw();
  });

  // Create tools for all the object constructors we know about
  var names = ConstructorRegistry.listNames();
  for (var i = 0; i < names.length; i++) {
      var button = $("<input></input>");
      button.attr("type", "radio");
      button.attr("name", "tools");
      button.attr("value", names[i]);
      button.attr("id", names[i]);
      var label = $("<label></label>");
      label.attr("for", names[i]);
      label.html(names[i] + " tool");
      $("#more-tools").append(button);
      $("#more-tools").append(label);
      $("#more-tools").append("<br/>");
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
    default:
	// Create a tool that creates instances using the constructor
	// matching the id of the selected radio button:
	var constructor = ConstructorRegistry.getConstructor(id);
	if (constructor) {
	    // if the prototype specifies a default width and height,
	    // then use a fixed-size placement tool; if its width and height
	    // are variable, use a rectangle tool.
	    if (constructor.prototype.hasOwnProperty("width")) {
		g_selectedTool = new GenericPlacementTool(constructor);
	    } else {
		g_selectedTool = new GenericRectangleTool(constructor);
	    }
	}
      break;
    }
  });

  TheWorld.loadFromServer(title, function() {
    $("#level-bg-url").val(TheWorld.bgUrl);
    $("#level-tileset-url").val(TheWorld.tilesetUrl);
    $("#level-goal-url").val(TheWorld.goalUrl);
    $("#level-music-url").val(TheWorld.musicUrl);
    $("#acceleration").val(PhysicsConstants.acceleration);
    $("#gravity").val(PhysicsConstants.gravity);
    $("#top-speed").val(PhysicsConstants.topSpeed);
    $("#jump-power").val(PhysicsConstants.jumpPower);
    $("#friction").val(PhysicsConstants.friction);
    redraw();
  });

});