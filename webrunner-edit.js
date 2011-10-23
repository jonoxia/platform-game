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
		var rect = this.defineRect(pt.x, pt.y);
		var context = $("#design-canvas")[0].getContext("2d");
		context.strokeStyle = "black";
		context.strokeRect(rect.l, rect.t, rect.w, rect.h);
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
    }
};

var ScrollTool = {
    startX: 0,
    startY: 0,
    onMouseDown: function(x, y) {
	this.startX = x;
	this.startY = y;
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	TheWorld.xOffset -= (x - this.startX);
	TheWorld.yOffset -= (y - this.startY);
    }
};

var StartTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	g_startLocation.left = pt.x;
	g_startLocation.top = pt.y;
    }
};

var GoalTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	var pt = worldCoords(x, y);
	g_goalLocation.left = pt.x;
	g_goalLocation.top = pt.y;
    }
};

var g_goalLocation = {
    left: 540,
    top: 340,
    get right() {
	return this.left + 64;
    },
    get bottom() {
	return this.top + 64;
    },
    draw: function(ctx) {
	ctx.strokeStyle = "black";
	ctx.strokeRect(this.left, this.top, 64, 64);
	ctx.strokeText("GOAL", this.left + 5, this.top +32);
    },
    detectIntercept: function(mob) {
	return null;
    }
};

var g_startLocation = {
    left: 0,
    top: 0,
    get right() {
	return this.left + 64;
    },
    get bottom() {
	return this.top + 64;
    },
    draw: function(ctx) {
	ctx.strokeStyle = "black";
	ctx.strokeRect(this.left, this.top, 64, 64);
	ctx.strokeText("START", this.left + 5, this.top +32);
    },
    detectIntercept: function(mob) {
	return null;
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
}

$(document).ready(function() {
	adjustToScreen();

	TheWorld.addForegroundObject(g_goalLocation);
	TheWorld.addForegroundObject(g_startLocation);
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