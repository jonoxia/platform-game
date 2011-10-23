const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW =38;
const SPACEBAR =32;

const SKY_COLOR = "rgb(100, 180, 240)";
const GROUND_COLOR = "rgb(150, 140, 110)";
const TRUNK_COLOR = "rgb(100, 100, 50)";
const LEAF_COLOR = "rgba(0, 200, 0, 0.8)";

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

  update: function() {
    // Gravity:
    if (!this.onGround()) {
      this.vy += 5;
    }

    // Collision detection
    var intercept = TheWorld.detectPlatformIntercept(this);
    if (intercept) {
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
    } else {
      // If no collision, move full velocity
      this.move(this.vx, this.vy);
    }

  },

  jump: function() {
    // Only jump if there is ground under me and nothing blocking
    // my head.
    if (this.onGround() &&
        ! TheWorld.touchingPlatform(this, "top")) {
      this.vy -= 30;
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
  }
};

var TheWorld = {
  xOffset: 0,  // how far to the right has the view scrolled from its starting location,
  yOffset: 0,
  canvasWidth: 800,
  canvasHeight: 600,
  get leftScrollMargin() {
	return 200;
	// if you go left of 200 pixels the screen scrolls left
    },
  get rightScrollMargin() {
      return this.canvasWidth - 200;
  },

  get topScrollMargin() {
      return 200;
  },

  get bottomScrollMargin() {
      return this.canvasHeight - 200;
  },

  // keep a list of background objects and a list of foreground objects --
  // all of these will get drawn
  backgroundObjects: [],
  foregroundObjects: [],

  addBackgroundObject: function(obj) {
    this.backgroundObjects.push(obj);
  },

  addForegroundObject: function(obj) {
    this.foregroundObjects.push(obj);
  },

  worldXToScreenX: function(worldX) {
    return worldX - this.xOffset;
  },

  worldYToScreenY: function(worldY) {
      return worldY - this.yOffset;
  },

  scrollIfNeeded: function(player) {
    // get screen coordinates of player's left and right edges
    var screenLeft = this.worldXToScreenX(player.left);
    var screenRight = this.worldXToScreenX(player.right);
    var screenTop = this.worldYToScreenY(player.top);
    var screenBottom = this.worldYToScreenY(player.bottom);

    // if player's left is left of left scroll margin, scroll left
    if (screenLeft < this.leftScrollMargin) {
        // scroll by just enough to get player's left lined up with
        // left scroll margin
	this.xOffset -= this.leftScrollMargin - screenLeft;
    }
    // if player's right is right of right scroll margin, scroll right
    if (screenRight > this.rightScrollMargin) {
        // scroll by just enough to get player's right lined up with
        // right scroll margin
	this.xOffset += screenRight - this.rightScrollMargin;
    }
    // Same for up and down:
    if (screenTop < this.topScrollMargin) {
	this.yOffset -= this.topScrollMargin - screenTop;
    }
    if (screenBottom > this.bottomScrollMargin) {
	this.yOffset += screenBottom - this.bottomScrollMargin;
    }
  },

  drawIfOnScreen: function(obj, ctx) {
    /* save time: don't bother drawing things that are off the screen.
     * This calls the given object's draw() method if it's on screen,
     * or does nothing if it's not. */
    if (this.worldXToScreenX(obj.right) < 0 ) {
      return;
    }
    if (this.worldXToScreenX(obj.left) > this.canvasWidth ) {
      return;
    }
    if (this.worldYToScreenY(obj.bottom) < 0 ) {
      return;
    }
    if (this.worldYToScreenY(obj.top) > this.canvasHeight ) {
      return;
    }
    obj.draw(ctx);
  },

  draw: function(ctx) {
    // blue sky
    ctx.fillStyle = SKY_COLOR;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Now apply the translate transform to scroll the world
    ctx.save();
    ctx.translate( 0 - this.xOffset, 0 - this.yOffset);
    // draw all background objects in their scrolled location
    var i, obj;
    for (i = 0; i < this.backgroundObjects.length; i++) {
      this.drawIfOnScreen(this.backgroundObjects[i], ctx);
    }
    // Draw foreground objects after background objects so they
    // appear in front
    for (i = 0; i < this.foregroundObjects.length; i++) {
      this.drawIfOnScreen(this.foregroundObjects[i], ctx);
    }
    ctx.restore();
  },

  detectPlatformIntercept: function(mob) {
    // Run through all platforms in the foregroundObjects list and
    // see whether mob is on a collision course with any of them.
    // If it is, return the intercept point.
    var intercept;
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      if (this.foregroundObjects[i] === mob) {
        // don't attempt collision with self!
        continue;
      }
      intercept = this.foregroundObjects[i].detectIntercept(mob);
      if (intercept) {
        return intercept;
      }
    }
    return null;
  },

  touchingPlatform: function(mob, direction) {
    // Run through all platforms in the foregroundObjects list
    // and see whether mob is current
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      var platform = this.foregroundObjects[i];
      if (platform === mob) {
        // don't attempt collision with self!
        continue;
      }

      switch (direction) {
      case "left":
        if (mob.left == platform.right &&
            mob.top <= platform.bottom &&
            mob.bottom >= platform.top) {
          return true;
        }
        break;
      case "right":
        if (mob.right == platform.left &&
            mob.top <= platform.bottom &&
            mob.bottom >= platform.top) {
          return true;
        }
        break;
      case "top":
        if (mob.top == platform.bottom &&
            mob.left < platform.right &&
            mob.right > platform.left) {
          return true;
        }
        break;
      case "bottom":
        if (mob.bottom == platform.top &&
            mob.left < platform.right &&
            mob.right > platform.left) {
          return true;
        }
        break;
      }
    }
    return false;
  }
};

function Platform(x, y, width, height) {
  this.left = x;
  this.top = y;
  this.width = width;
  this.height = height;
}
Platform.prototype = {
  get right() {
    return this.left + this.width;
  },

  get bottom() {
    return this.top + this.height;
  },

  draw: function(ctx) {
    ctx.fillStyle = GROUND_COLOR;
    ctx.strokeStyle = "black";
    ctx.fillRect(this.left, this.top, this.width, this.height);
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  },

  detectIntercept: function(mob) {
    /* Will mob's velocity cause it to cross one of the edges of this
     * platform?  returns object with edge name ("top" "left" "right"
     * or "bottom") and x,y of interception point. */
    var x_intercept, y_intercept;
    /* assumes that mob.vx, mob.vy, mob.left, mob.right, mob.top, and
     * mob.bottom are all defined in addition to this.left, this.top,
     * this.right, and this.bottom.  Could x-velocity carry mob across
     * the line of the left edge of this platform? */
    if (mob.right < this.left && mob.right + mob.vx >= this.left) {
      // At what y-value would the line of motion cross the line of the left edge?
      y_intercept = mob.y + mob.vy * (this.left - mob.right)/mob.vx;
      // Is that y-value inside the actual bounds of the left edge (hit) or outside (miss)?
      if (y_intercept + mob.height >= this.top && y_intercept <= this.bottom) {
        return { side: "left", x: this.left, y: y_intercept };
      }
    }

    // Could y-velocity carry mob across the line of the top edge of this platform?
    if (mob.bottom < this.top && mob.bottom + mob.vy >= this.top) {
      // At what x-value would line of motion cross line of top edge?
      x_intercept = mob.x + mob.vx * (this.top - mob.bottom)/mob.vy;
      // Is that x-value inside the actual bounds of the top edge?
      if (x_intercept + mob.width >= this.left && x_intercept <= this.right) {
        return { side: "top", x: x_intercept, y: this.top }; // todo should be this.top - mob.height?
      }
    }

    // Can possibly touch right edge?  (same logic)
    if (mob.left > this.right && mob.left + mob.vx <= this.right) {
      y_intercept = mob.y + mob.vy * (this.right - mob.left)/mob.vx;
      if (y_intercept + mob.height >= this.top && y_intercept <= this.bottom) {
        return { side: "right", x: this.right, y: y_intercept };
      }
    }

    // Can possibly touch bottom edge? (same logic)
    if (mob.top > this.bottom && mob.top + mob.vy <= this.bottom) {
      x_intercept = mob.x + mob.vx * (this.bottom - mob.top)/mob.vy;
      if (x_intercept + mob.width >= this.left && x_intercept <= this.right) {
        return { side: "bottom", x: x_intercept, y: this.bottom };
      }
    }

    // no collision:
    return null;
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

$(document).ready(function() {
  adjustToScreen();
  var context = $("#game-canvas")[0].getContext("2d");

  // Create player, put it in the world:
  var player = new RunningHuman("running_human_frames.png", 200, 0, 64, 64, true, 122);
  TheWorld.addForegroundObject(player);

  // the ground is just a really big platform
  TheWorld.addForegroundObject(new Platform(-10000, 0, 20000, 100));

  // Create some platform/ obstacles:
  TheWorld.addForegroundObject(new Platform(200, -140, 400, 32));
  TheWorld.addForegroundObject(new Platform(0, -500, 64, 500));
  TheWorld.addForegroundObject(new Platform(1200, -500, 64, 500));
  TheWorld.addForegroundObject(new Platform(700, -64, 64, 32));
  TheWorld.addForegroundObject(new Platform(64, -232, 64, 32));
  TheWorld.addForegroundObject(new Platform(200, -332, 400, 32));
  TheWorld.addForegroundObject(new Platform(864, -400, 128, 32));

  TheWorld.draw(context);

  var leftArrowDown = false;
  var rightArrowDown = false;

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

  window.setInterval(function() {
    if (leftArrowDown && !rightArrowDown) {
      player.goLeft();
    } else if (rightArrowDown && !leftArrowDown) {
      player.goRight();
    } else {
      player.idle();
    }
    player.update();

    TheWorld.draw(context);
  }, 100);

  // Call adjustToScreen if screen size changes
  var resizeTimer = null;
  $(window).resize(function() {
      if (resizeTimer) {
          clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(adjustToScreen, 500);
  });
});