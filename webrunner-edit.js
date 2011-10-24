
function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.7;
    TheWorld.canvasHeight = screenHeight * 0.7;

    $("#design-canvas").attr("width", TheWorld.canvasWidth);
    $("#design-canvas").attr("height", TheWorld.canvasHeight);
}

var PlatformTool = {
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
	return {l: left, t: top, w: width, h: height};
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
	    var plat = new Platform( rect.l, rect.t, rect.w, rect.h);
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
	TheWorld.startX = x;
	TheWorld.startY = y;
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

var g_selectedTool = PlatformTool;

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
    $("#debug").html("title is " + title);
    var i, objs;
    // TODO LATER background objects, special data like start location and goal
    var allData = {};
    var worldData = [];
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
    $.ajax({type: "POST", 
            url: URL,
	    data: {levelName: title,
		   levelData: JSON.stringify(allData)}, 
	    success: function(data, textStatus, jqXHR) {
		$("#debug").html(textStatus);
	    },
	    error: function(data, textStatus, thing) {
		$("#debug").html(thing);
	    },
	    dataType: "text"
	  });
    $("#debug").html(JSON.stringify(allData));
}

$(document).ready(function() {
        var title = gup("level");
	adjustToScreen();

	//TheWorld.addForegroundObject(g_startLocation);
	TheWorld.loadFromServer(title, function() {
		redraw();

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
		
		$("input").change(function() {
			var id = $("input[@name=testGroup]:checked").attr('id');
			switch (id) {
			case "platform-tool":
			    g_selectedTool = PlatformTool;
			    break;
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
	    });

    });