const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW =38;
const SPACEBAR =32;

const GOING_LEFT = 0;
const GOING_RIGHT = 1;
const STAND_STILL = 2;

function RunningHuman(filename, x, y, width, height, animate, topSpeed) {
  this.x = x;
  this.y = y - height;
  this.width = width;
  this.height = height;
  this.vx = 0;
  this.vy = 0;
  this.topSpeed = topSpeed;
  this.isAnimated = animate;
  if (animate) {
    this.animationFrame = 0;
    this.movementDirection = STAND_STILL;
  }
  this.init(filename);
}
RunningHuman.prototype = {
  imgLoaded: false,

  init: function(filename) {
    var self = this;
    this.img = new Image();
    this.img.onload = function() {
      self.imgLoaded = true;
    };
    this.img.src = filename;
  },

  draw: function(ctx) {
    if (this.imgLoaded) {
      if (this.isAnimated) {
        var spriteOffsetX = this.width * this.animationFrame;
        var spriteOffsetY = this.height * this.movementDirection;
        ctx.drawImage(this.img, spriteOffsetX, spriteOffsetY, this.width, this.height,
                      this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(this.img, this.x, this.y);
      }
    }
  },

  erase: function(ctx) {
    ctx.clearRect(this.x, this.y, this.width, this.height);
  },

  move: function(dx, dy) {
    this.jumping = false;
    if (dx == 0 && dy == 0 ) {
      this.animationFrame = 0;
      this.movementDirection = STAND_STILL;
    } else {
      this.animationFrame = (this.animationFrame + 1) % 5;
      if (dx <= 0) {
        this.movementDirection = GOING_LEFT;
      }
      if (dx > 0) {
        this.movementDirection = GOING_RIGHT;
      }
      this.x += dx;
      this.y += dy;
    }
    TheWorld.scrollIfNeeded(this);
  },

  onGround: function() {
    // is something under my feet?
    return TheWorld.touchingPlatform(this, "bottom");
  },

  stopAt: function(intercept) {
      // case where we hit a solid object before moving full velocity:
      // set location adjacent to it and cancel velocity in that
      // direction.

      switch (intercept.side) {
      case "top":
        this.vy = 0;
        this.x = intercept.x;
        this.y = intercept.y - this.height;
        break;
      case "left":
        this.vx = 0;
        this.x = intercept.x - this.width;
        this.y = intercept.y;
        break;
      case "right":
        this.vx = 0;
        this.x = intercept.x;
        this.y = intercept.y;
        break;
      case "bottom":
        this.vy = 0;
        this.x = intercept.x;
        this.y = intercept.y;
        break;
      }	
  },

  update: function() {
    // Gravity:
    if (!this.onGround()) {
      this.vy += 5;
    }

    // Collision detection
    var pathModified = TheWorld.detectPlatformIntercept(this);
    
    if (!pathModified) {
	// If no collision, move full velocity
	this.move(this.vx, this.vy);
    }
  },

  jump: function() {
    // Only jump if there is ground under me and nothing blocking
    // my head.
    if (this.onGround() && !this.jumping &&
        ! TheWorld.touchingPlatform(this, "top")) {
      this.vy -= 30;
      this.jumping = true; // to make jump idempotent, fix bug 2
    }
  },

  idle: function() {
    // Apply friction if touching ground:
    if (this.onGround()) {
      if (this.vx > 0) {
        this.vx -= 4;
        if (this.vx < 0) {
          this.vx = 0;
        }
      }

      if (this.vx < 0) {
        this.vx += 4;
        if (this.vx > 0) {
          this.vx = 0;
        }
      }
    }
  },

  goLeft: function() {
    if (! TheWorld.touchingPlatform(this, "left")) {
      if (this.vx > 0 - this.topSpeed) {
        this.vx -= 2;
      } else {
        this.vx = 0 - this.topSpeed;
      }
    }
  },

  goRight: function() {
    if (! TheWorld.touchingPlatform(this, "right")) {
      if (this.vx < this.topSpeed) {
        this.vx += 2;
      } else {
        this.vx = this.topSpeed;
      }
    }
  },

  get left() {
    return this.x;
  },

  get right() {
    return this.x + this.width;
  },

  get top() {
    return this.y;
  },

  get bottom() {
    return this.y + this.height;
  },

  intersecting: function(rect) {
      return (this.left <= rect.right && this.right >= rect.left
	      && this.top <= rect.bottom && this.bottom >= rect.top );
   }
};

function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.9;
    TheWorld.canvasHeight = screenHeight * 0.9;

    $("#game-canvas").attr("width", TheWorld.canvasWidth);
    $("#game-canvas").attr("height", TheWorld.canvasHeight);
}

function updateTimer(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    if (s < 10) {
	s_str = "0" + s;
    } else {
	s_str = s;
    }
    $("#timer").html( m + ":" + s_str);
}

$(document).ready(function() {
  adjustToScreen();
  var context = $("#game-canvas")[0].getContext("2d");
  var title = gup("level");
  var avatarURL = $("#avatarURL").html();
  

  TheWorld.loadFromServer(title, function() {

    // Create player, put it in the world:
    var player = new RunningHuman(avatarURL,
				  TheWorld.startX,
				  TheWorld.startY,
				  64, 64, true, 122);
    TheWorld.addForegroundObject(player);
    TheWorld.draw(context);

    var leftArrowDown = false;
    var rightArrowDown = false;

    var startTime = Date.now();

    $(document).bind("keydown", function(evt) {
	    if (evt.which == LEFT_ARROW) {
		leftArrowDown = true;
	    }
	    if (evt.which == RIGHT_ARROW) {
		rightArrowDown = true;
	    }
	    if (evt.which == SPACEBAR) {
		player.jump();
	    }
	});
    $(document).bind("keyup", function(evt) {
	    if (evt.which == LEFT_ARROW) {
		leftArrowDown = false;
	    }
	    if (evt.which == RIGHT_ARROW) {
		rightArrowDown = false;
	    }
	});

    var heartbeat = window.setInterval(function() {
	    if (leftArrowDown && !rightArrowDown) {
		player.goLeft();
	    } else if (rightArrowDown && !leftArrowDown) {
		player.goRight();
	    } else {
		player.idle();
	    }
	    player.update();
	    updateTimer(Date.now() - startTime);
	    TheWorld.draw(context);
	    // check for #WINNING:
	    if (player.intersecting(TheWorld.goalArea)) {
		$("#output").html("A WINRAR IS YOU!");
		window.clearInterval(heartbeat);
		$.ajax({type: "POST", 
			    url: "complete-level.py",
			    data: {levelName: title,
				completionTime: Date.now() - startTime},
			    success: function(data, textStatus, jqXHR) {
			    $("#debug").html(data);
			},
			    error: function(data, textStatus, thing) {
			    $("#debug").html(thing);
			},
			    dataType: "text"
			    });
		$("#debug").html("Saving score...");
	    }
	}, 100);
      });

  // Call adjustToScreen if screen size changes
  var resizeTimer = null;
  $(window).resize(function() {
      if (resizeTimer) {
          clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(adjustToScreen, 500);
  });
});