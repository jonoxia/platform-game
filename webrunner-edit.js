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
    startX: 0,
    startY: 0,

    onMouseDown: function(x, y) {
	this.startX = x;
	this.startY = y;

	this.currentPlatform = TheWorld.getPlatformAt(x, y);
	// If x, y is inside existing platform, set currentPlatform
	// to that one and set dragMode true.
	// Otherwise, create a new platform, set that one current,
	// and dragMode false.
    },

    onMouseMove: function(x, y) {
	if (this.currentPlatform != null) {
	    this.currentPlatform.left = x;
	    this.currentPlatform.top = y;
	}
    },

    onMouseUp: function(x, y) {
	if (!this.currentPlatform) {
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
		height = this.startY - y
	    } else {
		top = this.startY;
		height = y - this.startY;
	    }
	    var plat = new Platform( left, top, width, height);
	    TheWorld.addForegroundObject(plat);
	}
	this.currentPlatform = null;
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
	g_startLocation.left = x;
	g_startLocation.top = y;
    }
};

var GoalTool = {
    onMouseDown: function(x, y) {
    },

    onMouseMove: function(x, y) {
    },

    onMouseUp: function(x, y) {
	g_goalLocation.left = x;
	g_goalLocation.top = y;
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

$(document).ready(function() {
	adjustToScreen();
	var context = $("#design-canvas")[0].getContext("2d");

	TheWorld.addForegroundObject(g_goalLocation);
	TheWorld.addForegroundObject(g_startLocation);

	TheWorld.draw(context);

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
		TheWorld.draw(context);
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