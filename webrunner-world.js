const SKY_COLOR = "rgb(100, 180, 240)";
const GROUND_COLOR = "rgb(150, 140, 110)";
const TRUNK_COLOR = "rgb(100, 100, 50)";
const LEAF_COLOR = "rgba(0, 200, 0, 0.8)";


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

  screenXToWorldX: function(screenX) {
      return screenX + this.xOffset;
  },

  screenYToWorldY: function(screenY) {
      return screenY + this.yOffset;
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
  },

  getPlatformAt: function(x, y) {
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      var platform = this.foregroundObjects[i];
      if (x > platform.left && x <= platform.right 
	  && y > platform.top && y <= platform.bottom) {
	  return platform;
      }
    }
    return null;
  },

  loadFromServer: function (callback) {
    var url = "load-level.py";
    var self = this;
    $.get(url, {}, function(data, textStatus, jqXHR) {
	    var worldData = JSON.parse(data);
	    for (var i = 0; i < worldData.length; i++) {
		var plat = new Platform(worldData[i].x,
					worldData[i].y,
					worldData[i].width,
					worldData[i].height);
		self.addForegroundObject(plat);
	    }
	    callback();
	}, "html");
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
