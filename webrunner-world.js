const SKY_COLOR = "rgb(100, 180, 240)";
const GROUND_COLOR = "rgb(150, 140, 110)";
const TRUNK_COLOR = "rgb(100, 100, 50)";
const LEAF_COLOR = "rgba(0, 200, 0, 0.8)";

var ConstructorRegistry = {
    registry: {},

    register: function(constructor) {
	var name = constructor.prototype.type;
	this.registry[name] = constructor;
    },

    getConstructor: function(name) {
	return this.registry[name];
    },

    listNames: function() {
	var list = [];
	for (var name in this.registry) {
	    list.push(name);
	}
	return list;
    }
};

var PhysicsConstants = {
  topSpeed: 122,
  gravity: 7,
  jumpPower: 40,
  groundAcceleration: 8,
  groundDeceleration: 6,
  groundFriction: 3,
  airAcceleration: 4,
  airDeceleration: 3,
  airFriction: 1
};


function ProgressBar(ctx) {
    this._ctx = ctx;
}
ProgressBar.prototype = {
    draw: function(progress) {
	this._ctx.strokeStyle = "black";
	this._ctx.fillStyle = "green";
	this._ctx.strokeText("LOADING...",   // TODO l10n
			     TheWorld.canvasWidth /2,
			     TheWorld.canvasHeight/2 - 50);
	this._ctx.fillRect(TheWorld.canvasWidth/2 - 200,
			   TheWorld.canvasHeight/2,
			   400 * progress,
			   50);
	this._ctx.strokeRect(TheWorld.canvasWidth/2 - 200,
			     TheWorld.canvasHeight/2,
			     400,
			     50);
    }
};


var TheWorld = {
  xOffset: 0,  // how far to the right has the view scrolled from its starting location,
  yOffset: 0,
  canvasWidth: 800,
  canvasHeight: 600,
  startX: 0,
  startY: 0, // player start location

  bgUrl: "",
  bgImg: null,

  tileset: "",
  tilesetImages: {},

  goalUrl: "",
  goalImg: null,

  musicUrl: "",

  goalArea: {
	left: 500,
	top: 350,
	width: 64,
	height: 64,
	get right() { return this.left + this.width; },
	get bottom() { return this.top + this.height; },
	draw: function(ctx) {
	    if (TheWorld.goalImg) {
		// scale image to fit size of goal area
		ctx.drawImage(TheWorld.goalImg, 0, 0, TheWorld.goalImg.width, TheWorld.goalImg.height,
			      this.left, this.top, this.width, this.height);
	    } else {
		ctx.strokeStyle = "black";
                ctx.font="14pt arial";
		ctx.strokeRect(this.left, this.top, 64, 64);
                ctx.strokeText(getLocalString("_goal"), this.left + 5, this.top +32);
	    }
	},
	setBounds: function(l, t, w, h) {
	    this.left = l;
	    this.top = t;
	    this.width = w;
	    this.height = h;
	}
    },
  get leftScrollMargin() {
      return Math.floor(this.canvasWidth * 1 / 3);
  },
  get rightScrollMargin() {
      return Math.floor(this.canvasWidth * 2 / 3);
  },

  get topScrollMargin() {
      return Math.floor(this.canvasHeight * 1 / 3);
  },

  get bottomScrollMargin() {
      return Math.floor(this.canvasHeight * 2 / 3);
  },

  // keep a list of background objects and a list of foreground objects --
  // all of these will get drawn
  backgroundObjects: [],
  foregroundObjects: [],

  // Forces besides gravity (long-term todo: make gravity just an 
  // omnipresent one of these forces?)
  forceFields: [],

  addBackgroundObject: function(obj) {
    this.backgroundObjects.push(obj);
  },

  addForegroundObject: function(obj) {
    this.foregroundObjects.push(obj);
  },

  removeForegroundObject: function(obj) {
      var index = this.foregroundObjects.indexOf(obj);
      if (index != -1) {
          this.foregroundObjects.splice(index, 1);
      }
  },

  addForceField: function(obj) {
      this.forceFields.push(obj);
  },

  removeForceField: function(obj) {
      var index = this.forceFields.indexOf(obj);
      if (index != -1) {
          this.forceFields.splice(index, 1);
      }
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

      if (this.worldBounds) {
          this.xOffset = 0;
          this.yOffset = 0;
          return;
      }

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

  isOnScreen: function(obj) {
    if (this.worldXToScreenX(obj.right) < 0 ) {
      return false;
    }
    if (this.worldXToScreenX(obj.left) > this.canvasWidth ) {
      return false;
    }
    if (this.worldYToScreenY(obj.bottom) < 0 ) {
      return false;
    }
    if (this.worldYToScreenY(obj.top) > this.canvasHeight ) {
      return false;
    }
    return true;
  },

  drawIfOnScreen: function(obj, ctx) {
    /* save time: don't bother drawing things that are off the screen.
     * This calls the given object's draw() method if it's on screen,
     * or does nothing if it's not. */
    if (this.isOnScreen(obj)) {
	obj.draw(ctx);
    }
  },

  draw: function(ctx) {
    if (this.bgImg) {
	// tile img to cover whole background
	var w = this.bgImg.width;
	var h = this.bgImg.height;
	var x = 0 - (Math.floor(this.xOffset/3) % w) - w;
	while (x < this.canvasWidth) {
	    var y = 0 - (Math.floor(this.yOffset/3) % h) - h;
	    while ( y < this.canvasWidth ) {
		ctx.drawImage(this.bgImg, x, y);
		y += this.bgImg.height;
	    }
	    x += this.bgImg.width;
	}
    } else {
	// blue sky
	ctx.fillStyle = SKY_COLOR;
	ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    // Now apply the translate transform to scroll the world
    ctx.save();
    ctx.translate( 0 - this.xOffset, 0 - this.yOffset);
    // draw all background objects in their scrolled location
    var i, obj;
    for (i = 0; i < this.backgroundObjects.length; i++) {
      this.drawIfOnScreen(this.backgroundObjects[i], ctx);
    }

    // Draw goal area:
      //this.drawIfOnScreen(this.goalArea, ctx);

    // Draw foreground objects after background objects so they
    // appear in front
    for (i = 0; i < this.foregroundObjects.length; i++) {
      this.drawIfOnScreen(this.foregroundObjects[i], ctx);
    }

    for (i = 0; i < this.forceFields.length; i++) {
      this.drawIfOnScreen(this.forceFields[i], ctx);
    }

    ctx.restore();
  },

  detectPlatformIntercept: function(mob, xDist, yDist) {
    // Run through all platforms in the foregroundObjects list and
    // see whether mob is on a collision course with any of them.
    // Call the onMobTouch methods of any objects I intercept with,
    // in order of closest first.

    var intercepts = [];// may intercept with more than one.
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      if (this.foregroundObjects[i] === mob) {
        // don't attempt collision with self!
        continue;
      }
      intercept = this.foregroundObjects[i].detectIntercept(mob, xDist, yDist);
      if (intercept) {
	  intercepts.push( { box: this.foregroundObjects[i],
                             cept: intercept } );
      }
    }
    // sort in increasing order of t (time-until intercept)

    // If only one intercept, just do it:
    intercepts.sort(function(a, b) { return a.cept.t - b.cept.t;} );
    var pathModified;

    for (i = 0; i < intercepts.length; i++) {
	pathModified = intercepts[i].box.onMobTouch(mob, intercepts[i].cept);
	// if first collision modifies mob's path, then mob MAY OR MAY NOT
	// actually collide with any of the other items...
	if (pathModified) {
	    return true;
	}
	// If the first one returns true, don't process any more...
    }
    return false;
  },

  touchingClimbableArea: function(mob) {
      // returns true if mob is interesecting with an object
      // that has climbable() return true, e.g. a ladder
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      var platform = this.foregroundObjects[i];
      if (platform === mob) {
        // don't attempt collision with self!
        continue;
      }

      if (mob.intersecting(platform)) {
          if (platform.climbable(mob)) {
              return true;
          }
      }
    }
    return false;
  },

  touchingForceFields: function(mob) {
    var netForce = {x: 0, y: 0};
    for (var i = 0; i < this.forceFields.length; i++) {
      var field = this.forceFields[i];

      if (mob.intersecting(field)) {
          var fieldForce = field.calculateForce(mob);
          netForce.x += fieldForce.x;
          netForce.y += fieldForce.y;
      }
    }
    return netForce;
  },

  touchingPlatform: function(mob, direction) {
    // Run through all platforms in the foregroundObjects list
    // and see whether mob is currently touching any of them
    // returns the platform, or null if none
    // e.g. touchingPlatform(mob, "bottom") gets platform under mob
    for (var i = 0; i < this.foregroundObjects.length; i++) {
      var platform = this.foregroundObjects[i];
      if (platform === mob) {
        // don't attempt collision with self!
        continue;
      }

      switch (direction) {
      case "left":
        if (mob.left == platform.right &&
	    platform.substantial("right") &&
            mob.top <= platform.bottom &&
            mob.bottom >= platform.top) {
          return platform;
        }
        break;
      case "right":
        if (mob.right == platform.left &&
	    platform.substantial("left") &&
            mob.top <= platform.bottom &&
            mob.bottom >= platform.top) {
          return platform;
        }
        break;
      case "top":
        if (mob.top == platform.bottom &&
	    platform.substantial("bottom") &&
            mob.left < platform.right &&
            mob.right > platform.left) {
          return platform;
        }
        break;
      case "bottom":
        if (mob.bottom == platform.top &&
	    platform.substantial("top") &&
            mob.left < platform.right &&
            mob.right > platform.left) {
          return platform;
        }
        break;
      }
    }
    return null;
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

  updateEveryone: function(elapsedTime) {
    for (var i = 0; i < this.foregroundObjects.length; i++) {
	var obj = this.foregroundObjects[i];
	if (!this.isOnScreen(obj)) {
	    continue;
	}
	if (obj.roam) {
	    obj.roam(elapsedTime);
	}
	if (obj.update) {
	    obj.update(elapsedTime);
	}
    }
  },

  getBottomLimit: function() {
      var bottomLimit = 0;
      for (var i = 0; i < this.foregroundObjects.length; i++) {
	  var bottom = this.foregroundObjects[i].bottom;
	  if (bottom > bottomLimit) {
	      bottomLimit = bottom;
	  }
      }
      if (this.goalArea.bottom > bottomLimit) {
	  bottomLimit = this.goalArea.bottom;
      }
      return bottomLimit + 100;
  },

  cleanUpDead: function() {
      // Remove any dead ones from foregroundObjects
      // careful, don't splice stuff out while iterating the array itself
      var deadies = [];
      for (var i = 0; i < this.foregroundObjects.length; i++) {
	  if (this.foregroundObjects[i].dead) {
	      deadies.push(this.foregroundObjects[i]);
	  }
      }
      for (i = 0; i < deadies.length; i++) {
	  this.removeForegroundObject(deadies[i]);
	  this.backgroundObjects.push(deadies[i]); // make it fall off screen in background
      }

      for (i = 0; i < this.backgroundObjects.length; i++) {
	  var bobj = this.backgroundObjects[i];
	  if (bobj.dead) {
	      bobj.vy += 5; // and flip them upside down too!
	      bobj.top += bobj.vy; // and flip them upside down too!
	  }
      }
  },

  loadFromString: function(data, loader, callback) {
      // If there were objects already? wipe them all!
      this.backgroundObjects = [];
      this.foregroundObjects = [];
      this.forceFields = [];

      var self = this;
      //$("#debug").html("In callback, parsing json: " + data );
      var parsedData = JSON.parse(data);
      self.startX = parsedData.startX;
      self.startY = parsedData.startY;

      if (parsedData.worldBounds) {
          this.worldBounds = parsedData.worldBounds;
      } else {
          this.worldBounds = null;
      }
      // background img
      self.bgUrl = parsedData.bgUrl;
      if (self.bgUrl && self.bgUrl!= "") {
	  self.bgImg = loader.add(self.bgUrl);
      } else {
          self.bgImg = null;
      }
      // tileset images
      self.tileset = parsedData.tilesetUrl;
      if (self.tileset && self.tileset != "") {
          var tileUrls = JSON.parse(self.tileset);
	  for (var name in tileUrls) {
	      if (tileUrls[name] != "") {
		  self.tilesetImages[name] = loader.add(tileUrls[name]);
	      }
	  }
      }
      // goal img
      self.goalUrl = parsedData.goalUrl;
      if (self.goalUrl && self.goalUrl != "") {
	  self.goalImg = loader.add(self.goalUrl);
      }
      self.musicUrl = parsedData.musicUrl;
      var worldData = parsedData.worldData;
      for (var i = 0; i < worldData.length; i++) {
	  var type = worldData[i].type;
	  var cons = ConstructorRegistry.getConstructor(type);
	  if (cons) {
	      var obj = new cons(loader);
	      obj.boxInit(worldData[i].x,
			  worldData[i].y,
			  worldData[i].width,
			  worldData[i].height);
	      self.addForegroundObject(obj);
	  }
	  if (type == "goal") {
	      // Set the goal rectangle
	      self.goalArea.setBounds(worldData[i].x,
				      worldData[i].y,
				      worldData[i].width,
				      worldData[i].height);
	  }
      }
      // modified physics:
      if (parsedData.physicsConsts) {
	  var parsedConsts = JSON.parse(parsedData.physicsConsts);
	  if (typeof parsedConsts.airDeceleration != "undefined") {
	      PhysicsConstants = parsedConsts;
	  }
      }
      self.published = parsedData.published;
      //$("#debug").html("Loaded.");
      callback(loader);
  },

  loadFromServer: function (levelName, loader, callback) {
    var url = "load-level.py";
    var self = this;
    $("#debug").html("Loading level..."); // TODO l10n
    $.get(url, {levelName: levelName}, function(data, textStatus, jqXHR) {
	    self.loadFromString(data, loader, callback);
	}, "html");
  },

  getObjectsOfType: function(type) {
      var results = [];
      for (var i = 0; i < this.foregroundObjects.length; i++) {
          if (this.foregroundObjects[i].type == type) {
              results.push(this.foregroundObjects[i]);
          }
      }
      return results;
  }
};

function Box() {
}
Box.prototype = {
  boxInit: function(x, y, width, height) {
    this.left = x;
    this.top = y;
    this.width = width;
    this.height = height;
  },
  get right() {
    return this.left + this.width;
  },

  get bottom() {
    return this.top + this.height;
  },

  detectIntercept: function(mob, xDist, yDist) {
    /* Will mob's velocity cause it to cross one of the edges of this
     * platform?  returns object with edge name ("top" "left" "right"
     * or "bottom") and x,y of interception point. */
    var x_intercept, y_intercept, d_t;
    /* assumes that  mob.left, mob.right, mob.top, and
     * mob.bottom are all defined in addition to this.left, this.top,
     * this.right, and this.bottom. */

     /* Could x-velocity carry mob across
     * the line of the left edge of this platform? */
    if (mob.right < this.left && mob.right + xDist >= this.left) {
      // How long does it take you to reach the line of the left edge?
      dt = (this.left - mob.right)/xDist;
      // At what y-value would the line of motion cross the line of the left edge?
      y_intercept = mob.top + yDist * dt;
      // Is that y-value inside the actual bounds of the left edge (hit) or outside (miss)?
      if (y_intercept + mob.height >= this.top && y_intercept <= this.bottom) {
        return { side: "left", x: this.left, y: y_intercept, t: dt };
      }
    }

    // Could y-velocity carry mob across the line of the top edge of this platform?
    if (mob.bottom < this.top && mob.bottom + yDist >= this.top) {
      // At what x-value would line of motion cross line of top edge?
      dt = (this.top - mob.bottom)/yDist;
      x_intercept = mob.left + xDist * dt;
      // Is that x-value inside the actual bounds of the top edge?
      if (x_intercept + mob.width >= this.left && x_intercept <= this.right) {
        return { side: "top", x: x_intercept, y: this.top, t: dt }; // todo should be this.top - mob.height?
      }
    }

    // Can possibly touch right edge?  (same logic)
    if (mob.left > this.right && mob.left + xDist <= this.right) {
      dt = (this.right - mob.left)/xDist;
      y_intercept = mob.top + yDist * dt;
      if (y_intercept + mob.height >= this.top && y_intercept <= this.bottom) {
        return { side: "right", x: this.right, y: y_intercept, t: dt };
      }
    }

    // Can possibly touch bottom edge? (same logic)
    if (mob.top > this.bottom && mob.top + yDist <= this.bottom) {
      dt = (this.bottom - mob.top)/yDist;
      x_intercept = mob.left + xDist * dt;
      if (x_intercept + mob.width >= this.left && x_intercept <= this.right) {
        return { side: "bottom", x: x_intercept, y: this.bottom, t: dt };
      }
    }

    // no collision:
    return null;
  },

  substantial: function(edge) {
      return false;
  },

  climbable: function(mob) {
      // is this climbable by given mob?
      return false;
  },

  intersecting: function(rect) {
      return (this.left <= rect.right && this.right >= rect.left
	      && this.top <= rect.bottom && this.bottom >= rect.top );
    },

  onMobTouch: function(mob, intercept) {
	// override this if you want to do something
  },
  fillTiled: function(ctx, img, sliceLeft, sliceTop, sliceWidth, sliceHeight) {
      var x = 0;
      // todo duplicates some code from TheWorld.draw()
      while (x < this.width) {
	  var y = 0;
	  while ( y < this.height ) {
	      var width = Math.min(sliceWidth, this.width - x);
	      var height = Math.min(sliceHeight, this.height - y);
	      ctx.drawImage(img, sliceLeft, sliceTop, width, height, this.left + x, this.top +y, width, height);
	      y += sliceHeight;
	    }
	  x += sliceWidth;
      }
  }
};

function ForceField() {
}
ForceField.prototype = {
    type: "forcefield",
    classification: "forcefield",
    vectorX: 0,
    vectorY: 0,

    draw: function(ctx) {
        // generally invisible, but we'll draw box for debugging
        ctx.strokeStyle = "red";
        ctx.strokeRect(this.left, this.top, this.width, this.height);
    },

    setVector: function(x, y) {
        this.vectorX = x;
        this.vectorY = y;
    },

    calculateForce: function(mob) {
        // exerts force on any mobs passing through it
        // this function allows us to calculate force that varies
        // by position or velocity or type of mob
        // Should mobs have weight?
        return {x: this.vectorX, y: this.vectorY};
    }
}
ForceField.prototype.__proto__ = new Box();
ConstructorRegistry.register(ForceField);


function Platform() {
}
Platform.prototype = {
  type: "platform",
  classification: "obstacle",

  getFrictionCoefficient: function() {
      return PhysicsConstants.groundFriction;
  },

  getAccelerationCoefficient: function() {
      return PhysicsConstants.groundAcceleration;
  },

  draw: function(ctx) {
    if (TheWorld.tilesetImages["platform-img-url"]) {
	this.fillTiled(ctx, TheWorld.tilesetImages["platform-img-url"], 0, 0, 64, 64);
    } else {
	ctx.fillStyle = GROUND_COLOR;
	ctx.fillRect(this.left, this.top, this.width, this.height);
    }
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  },

  onMobTouch: function(mob, intercept) {
      console.log("Touching platform - intercept side is " + intercept.side);
    // fudge factor to allow walking up steps, added by Slifty
      console.log("mob bottom is " + mob.bottom + "; this.top is " + this.top);
    if ((intercept.side == "left" || intercept.side == "right") &&
	mob.bottom >= this.top && mob.bottom < this.top + 5) { // Are you walking up steps?
            console.log("Fudged it");
      mob.top = this.top - mob.height; // set the tile to the top of the next step
      return false; // This doesn't count as an intercept any longer
    }
    mob.stopAt(intercept);
    return true;
  },

  substantial: function(edge) {
      return true;
  }
};
Platform.prototype.__proto__ = new Box();
ConstructorRegistry.register(Platform);

function SemiPermiablePlatform() {
}
SemiPermiablePlatform.prototype = {
  type: "semiplatform",
  classification: "obstacle",

  getFrictionCoefficient: function() {
      return PhysicsConstants.groundFriction;
  },

  getAccelerationCoefficient: function() {
      return PhysicsConstants.groundAcceleration;
  },

  draw: function(ctx) {
    if (TheWorld.tilesetImages["semiplatform-img-url"]) {
	this.fillTiled(ctx, TheWorld.tilesetImages["semiplatform-img-url"], 0, 0, 64, 64);
    } else {
	ctx.fillStyle = "green";
	ctx.fillRect(this.left, this.top, this.width, this.height);
    }
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  },

  onMobTouch: function(mob, intercept) {
    if (intercept.side == "top") {
      mob.stopAt(intercept);
      return true;
    }
    return false;
    },

  substantial: function(edge) {
    return (edge == "top");
  }
};
SemiPermiablePlatform.prototype.__proto__ = new Box();
ConstructorRegistry.register(SemiPermiablePlatform);

function PowerUp() {
}
PowerUp.prototype = {
  type: "powerup",
  classification: "powerup",
  draw: function(ctx) {
  },
  onMobTouch: function(mob, intercept) {
    if (mob.type == "player") {
      // monsters don't collect powerups
      TheWorld.removeForegroundObject(this);
      this.onCollect(mob);
      // TODO play a sound here or something?
    }
    return false;
  },
  onCollect: function(player) {
    // Default is to do nothing, but override this in subclasses...
  }
};
PowerUp.prototype.__proto__ = new Box();
// We're not registering this one because it should never be
// instantiated.

/*function SpeedPlus() {
}
SpeedPlus.prototype = {
  type: "speedplus",
  classification: "powerup",
  width: 32,
  height: 32,
  draw: function(ctx) {
    ctx.strokeStyle = "blue";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
    ctx.strokeText("+ SPD", this.left + 5, this.top +32);
  },
  onCollect: function(player) {
    // TODO needs to be rewritten to work with PhysicsConstants
    player.topSpeed += 30;
    player.acceleration += 1;
    // TODO this is permanent -- make it revokable / time-limited?
    $("#debug").html("SPEED UP!"); // TODO better place for these msgs?
  }
};
SpeedPlus.prototype.__proto__ = new PowerUp();
ConstructorRegistry.register(SpeedPlus);

function JumpPlus() {
}
JumpPlus.prototype = {
  type: "jumpplus",
  classification: "powerup",
  width: 32,
  height: 32,
  draw: function(ctx) {
    ctx.strokeStyle = "red";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
    ctx.strokeText("+ JMP", this.left + 5, this.top +32);
  },
  onCollect: function(player) {
    player.jumpPower += 15;
    // TODO this is permanent -- make it revokable / time-limited?
    $("#debug").html("POWER JUMP!"); // TODO better place for these msgs?
  }
};
JumpPlus.prototype.__proto__ = new PowerUp();
ConstructorRegistry.register(JumpPlus);
*/

function PointlessTrinket() {
}
PointlessTrinket.prototype = {
  type: "trinket",
  classification: "powerup",
  width: 32,
  height: 32,
  draw: function(ctx) {
    if (TheWorld.tilesetImages["trinket-img-url"]) {
	ctx.drawImage(TheWorld.tilesetImages["trinket-img-url"], this.left, this.top, 32, 32);
    } else {
	ctx.fillStyle = "yellow";
	ctx.beginPath();
	ctx.arc(this.left + this.width/2, this.top + this.height/2, this.height/2, 0, 2*Math.PI, false);
	ctx.fill();
    }
  },
  onCollect: function(player) {
    playSfx("kaching-sfx");
    player.numTrinkets ++;
    $("#trinkets").html(player.numTrinkets);
  }
};
PointlessTrinket.prototype.__proto__ = new PowerUp();
ConstructorRegistry.register(PointlessTrinket);

function DisappearingBlock() {
}
DisappearingBlock.prototype = {
  type: "disappearing_block",
  classification: "obstacle",
  visible: true,
  time: 0,

  draw: function(ctx) {
    if (this.visible) {
	ctx.fillStyle = "purple";
	ctx.strokeStyle = "black";
	ctx.fillRect(this.left, this.top, this.width, this.height);
	ctx.strokeRect(this.left, this.top, this.width, this.height);
    }
  },

  onMobTouch: function(mob, intercept) {
    if (this.visible) {
      mob.stopAt(intercept);
      return true;
    }
    return false;
  },

  substantial: function(edge) {
    return (this.visible);
  },

  update: function(elapsedTime) {
    this.time += elapsedTime;
    // visible every other second:
    this.visible = (Math.floor(this.time / 1000) ) % 2 == 0;
  }
};
DisappearingBlock.prototype.__proto__ = new Box();
ConstructorRegistry.register(DisappearingBlock);

function ButtonBlock() {
}
ButtonBlock.prototype = {
  type: "button_block",
  classification: "obstacle",
  activated: false,
  activationTime: 5000,
  timer: 0,
  width: 70,
  height: 10,

  draw: function(ctx) {
    if (!this.activated) {
	  ctx.fillStyle = "red";
      ctx.fillRect(this.left, this.top, this.width, this.height);
      ctx.strokeStyle = "black";
      ctx.strokeRect(this.left, this.top, this.width, this.height);
    }
  },

  onMobTouch: function(mob, intercept) {
    if (this.activated) {
      return false;
    }
    else if (mob.type == "player" && intercept.side == "top") {
      this.activate_button();
      return false;
    }
    else {
      mob.stopAt(intercept);
      return true;
    }
  },

  substantial: function(edge) {
    return !this.activated;
  },

  update: function(elapsedTime) {
    if (this.activated) {
      this.timer += elapsedTime;
      if (this.timer > this.activationTime) {
        this.deactivate_button();
      }
    }
  },

  deactivate_button: function() {
    this.activated = false;
    var i = 0;
    for (i=0; i < TheWorld.foregroundObjects.length; i++) {
      var obj = TheWorld.foregroundObjects[i];
      if (obj.button_deactivated) {
        obj.button_deactivated();
      }
    }
  },

  activate_button: function() {
    this.activated = true;
    this.timer = 0;
    var i = 0;
    for (i=0; i < TheWorld.foregroundObjects.length; i++) {
      var obj = TheWorld.foregroundObjects[i];
      if (obj.button_activated) {
        obj.button_activated();
      }
    }
  }
}
ButtonBlock.prototype.__proto__ = new Box();
ConstructorRegistry.register(ButtonBlock);

function TrapdoorBlock() {
}
TrapdoorBlock.prototype = {
  type: "trapdoor_block",
  classification: "obstacle",
  open: false,
  width: 100,
  height: 10,

  draw: function(ctx) {
    if (this.open) {
      ctx.globalAlpha = 0.5;
    }
    else {
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "orange";
    ctx.fillRect(this.left, this.top, this.width, this.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
    ctx.globalAlpha = 1;
  },

  onMobTouch: function(mob, intercept) {
    if (!this.open) {
      mob.stopAt(intercept);
      return true;
    }
    else {
      return false;
    }
  },

  substantial: function(edge) {
    return !this.open;
  },

  button_deactivated: function() {
    this.open = false;
  },

  button_activated: function() {
    this.open = true;
  }
}
TrapdoorBlock.prototype.__proto__ = new Box();
ConstructorRegistry.register(TrapdoorBlock);

function ActivatedBlock() {
}
ActivatedBlock.prototype = {
  type: "activated_block",
  classification: "obstacle",
  active: false,
  width: 100,
  height: 10,

  draw: function(ctx) {
    if (!this.active) {
      ctx.globalAlpha = 0.5;
    }
    else {
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.left, this.top, this.width, this.height);
    ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
    ctx.globalAlpha = 1;
  },

  onMobTouch: function(mob, intercept) {
    if (this.active) {
      mob.stopAt(intercept);
      return true;
    }
    else {
      return false;
    }
  },

  substantial: function(edge) {
    return this.active;
  },

  button_deactivated: function() {
    this.active = false;
  },

  button_activated: function() {
    this.active = true;
  }
}
ActivatedBlock.prototype.__proto__ = new Box();
ConstructorRegistry.register(ActivatedBlock);

function RubberBlock() {
}
RubberBlock.prototype = {
  type: "rubber_block",
  classification: "obstacle",

  draw: function(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(this.left, this.top, this.width, this.height);
  },

  onMobTouch: function(mob, intercept) {
    var vx = mob.vx;
    var vy = mob.vy;
    mob.stopAt(intercept);
    if (intercept.side == "left" || intercept.side == "right") {
	mob.vx = (-0.9) * vx;
    }
    if (intercept.side == "top" || intercept.side == "bottom") {
	mob.vy = (-0.9) * vy;
    }
      return true;
  },

  substantial: function(edge) {
    return true;
  }
};
RubberBlock.prototype.__proto__ = new Box();
ConstructorRegistry.register(RubberBlock);

function Ladder() {
}
Ladder.prototype = {
    type: "ladder",
    classification: "obstacle",

    draw: function(ctx) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left, this.bottom);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.right, this.top);
        ctx.lineTo(this.right, this.bottom);
        ctx.stroke();
        
        for (y = this.bottom - 32; y > this.top; y -= 32) {
            ctx.beginPath();
            ctx.moveTo(this.left, y);
            ctx.lineTo(this.right, y);
            ctx.stroke();
        }
    },

    climbable: function(mob) {
        // always climbable!
        return true;
    },

    substantial: function(edge) {
        return false;
    }
};
Ladder.prototype.__proto__ = new Box();
ConstructorRegistry.register(Ladder);


function IceBlock() {
}
IceBlock.prototype = {
  type: "ice_block",
  classification: "obstacle",

  getFrictionCoefficient: function() {
      return 0.2;
  },

  getAccelerationCoefficient: function() {
      return 1.0;
  },

  draw: function(ctx) {
    ctx.fillStyle = "lightblue";
    ctx.fillRect(this.left, this.top, this.width, this.height);
      ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  }
};
IceBlock.prototype.__proto__ = new Platform();
ConstructorRegistry.register(IceBlock);

function SliceableBlock() {
}
SliceableBlock.prototype = {
  type: "sliceable_block",
  classification: "obstacle",

  draw: function(ctx) {
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(this.left, this.top, this.width, this.height);
      ctx.strokeStyle = "black";

      var gridSize = 32;
      for (var x = this.left; x <= this.right; x+= gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, this.top);
          ctx.lineTo(x, this.bottom);
          ctx.stroke();
      }
      for (var y = this.top; y <= this.bottom; y+= gridSize) {
          ctx.beginPath();
          ctx.moveTo(this.left, y);
          ctx.lineTo(this.right, y);
          ctx.stroke();
      }
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  }
};
SliceableBlock.prototype.__proto__ = new Platform();
ConstructorRegistry.register(SliceableBlock);

function TippyBlock() {
}
TippyBlock.prototype = {
    type: "tippy_block",
    classification: "obstacle",
    theta: 0,
    angularMomentum: 0,
    tipped: false,

    update: function(elapsedTime) {
        if (this.angularMomentum != 0) {
            // tip over in bumped direction
            this.theta += this.angularMomentum * elapsedTime /100;
            this.angularMomentum *= 1.05; // acceleration
            // stop once we get horizontal:
            if (this.theta > Math.PI/2) {
                this.theta = 0;
                this.angularMomentum = 0;
                // change bounding box to match:
                this.boxInit((this.left + this.right)/2,
                             this.bottom - this.width/2,
                             this.height,
                             this.width);
            }

            if (this.theta < (-1)*Math.PI/2) {
                this.theta = 0;
                this.angularMomentum = 0;
                this.boxInit((this.left + this.right)/2 - this.height,
                             this.bottom - this.width/2,
                             this.height,
                             this.width);
            }
        }
    },

    draw: function(ctx) {
        ctx.save();
        if (this.theta != 0) {
            var fulcrumX = (this.left + this.right) / 2;
            var fulcrumY = this.bottom;
            ctx.translate(fulcrumX, fulcrumY);
            ctx.rotate(this.theta);
            ctx.translate((-1)*fulcrumX, (-1)*fulcrumY);
        }
        SliceableBlock.prototype.draw.call(this, ctx);
        ctx.restore();
    },
    
    onMobTouch: function(mob, intercept) {
        mob.stopAt(intercept);
        if (!this.tipped) {
            // bump me to either side
            if (intercept.side == "left") {
                this.angularMomentum = Math.PI/60;
                this.tipped = true;
            }
            if (intercept.side == "right") {
                this.angularMomentum = (-1) * Math.PI/60;
                this.tipped = true;
            }
        }
        return true;
    }
}
TippyBlock.prototype.__proto__ = new Platform();
ConstructorRegistry.register(TippyBlock);

function PushableBlock() {
}
PushableBlock.prototype = {
  type: "pushable_block",
  classification: "obstacle",

  draw: function(ctx) {
    ctx.fillStyle = "lightblue";
    ctx.fillRect(this.left, this.top, this.width, this.height);
      ctx.strokeStyle = "black";
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  }
};
PushableBlock.prototype.__proto__ = new Platform();
ConstructorRegistry.register(PushableBlock);

// more: ladders, springboards, moving platforms, etc
// need some uI to set parameters for these -- the movement range of
// moving platforms, the timing of disappearing blocks, etc.