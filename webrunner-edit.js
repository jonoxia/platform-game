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
};

var ScrollTool = {
};

var StartTool = {
};

var GoalTool = {
};

var selectedTool = PlatformTool;

function canvasCoords(evt) {
    var xOffset = $("#design-canvas").offset().left;
    var yOffset = $("#design-canvas").offset().top;
    return {x: evt.pageX - xOffset,
	    y: evt.pageY - yOffset};
}

$(document).ready(function() {
	adjustToScreen();
	var context = $("#design-canvas")[0].getContext("2d");
	TheWorld.draw(context);

	$("#design-canvas").bind("mousedown", function(evt) {
		pos = canvasCoords(evt);
		selectedTool.onMouseDown(pos.x, pos.y);
	    });
	$("#design-canvas").bind("mousemove", function(evt) {
		pos = canvasCoords(evt);
		selectedTool.onMouseMove(pos.x, pos.y);
	    });
	$("#design-canvas").bind("mouseup", function(evt) {
		pos = canvasCoords(evt);
		selectedTool.onMouseUp(pos.x, pos.y);
		TheWorld.draw(context);
	    });
    });