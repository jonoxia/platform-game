const GOING_LEFT = 0;
const GOING_RIGHT = 1;
const STAND_STILL = 2;

function Mob(loader, filename, x, y, width, height, animate) {
  if (filename) {
    this.boxInit(x, y, width, height);
    this.mobInit(loader, filename, animate);
  }
}
Mob.prototype = {
  dead: false,
  _pixelsTraveled: 0,

  hitPoints: 1,
  jumping: false,
  img: null,
  climbSpeed: 0,
  lastMoved: STAND_STILL,

  mobInit: function(loader, filename, animate) {
    var self = this;
    this.img = loader.add(filename);

    if ((filename.indexOf(".gif") > -1 || filename.indexOf(".svg") > -1) && filename != "shrimp.gif") {
      this.hackImg = $("<img>").attr("src", filename).attr("class", "anim-gif");
      
      this.hackImg.attr("width", this.width)
      this.hackImg.attr("height", this.height);
      $("#gifslum").append(this.hackImg);
      this.horribleHack = true;
    }

    this.vx = 0;
    this.vy = 0;

    this.isAnimated = animate;
    if (animate) {
	this.animationFrame = 0;
	this.movementDirection = STAND_STILL;
    }
  },

  draw: function(ctx) {
    if (this.horribleHack) {
	this.hackImg.css("left", TheWorld.worldXToScreenX(this.left) + $("#game-canvas").offset().left); // if using this method, we have to do wold transform
	this.hackImg.css("top", TheWorld.worldYToScreenY(this.top) + $("#game-canvas").offset().top);
    } else if (this.isAnimated) {
        var offsets = this.selectSprite();
        var spriteOffsetX = this.width * offsets.x;
        var spriteOffsetY = this.height * offsets.y;
      ctx.drawImage(this.img, spriteOffsetX, spriteOffsetY, this.width, this.height,
		    this.left, this.top, this.width, this.height);
    } else {
      ctx.drawImage(this.img, this.left, this.top);
    }
  },

  selectSprite: function() {
    return {x: this.animationFrame, y: this.movementDirection};
  },

  erase: function(ctx) {
    ctx.clearRect(this.left, this.top, this.width, this.height);
  },

  move: function(dx, dy) {
	// advancing 12 pixels = 1 frame
    if (dx == 0 && dy == 0 ) {
      this.animationFrame = 0;
      this._pixelsTraveled = 0;
      this.movementDirection = STAND_STILL;
    } else {
	this.animationFrame = Math.floor(this._pixelsTraveled / 12) % 5;
      if (dx <= 0) {
        this.movementDirection = GOING_LEFT;
      }
      if (dx > 0) {
        this.movementDirection = GOING_RIGHT;
      }
      this.left += dx;
      this.top += dy;
    }
  },

  onGround: function() {
    // is something under my feet?
      // TODO - expensive operation, frequently checked. cache the result 
      // utnil it changes.
      return (TheWorld.touchingPlatform(this, "bottom") != null);
  },

  stopAt: function(intercept) {
      // case where we hit a solid object before moving full velocity:
      // set location adjacent to it and cancel velocity in that
      // direction.

      switch (intercept.side) {
      case "top":
        this.vy = 0;
        this.left = intercept.x;
        this.top = intercept.y - this.height;
        break;
      case "left":
        this.vx = 0;
        this.left = intercept.x - this.width;
        this.top = intercept.y;
        playSfx("bonk-sfx");
        break;
      case "right":
        this.vx = 0;
        this.left = intercept.x;
        this.top = intercept.y;
        playSfx("bonk-sfx");
        break;
      case "bottom":
        this.vy = 0;
        this.left = intercept.x;
        this.top = intercept.y;
        playSfx("bonk-sfx");
        break;
      }
  },

  update: function(elapsedTime) {
    // here's where we apply all physics to mobile objects
    var platform = TheWorld.touchingPlatform(this, "bottom");

    if (this.motionMode == "climb") {
        // check for falling off ladder:
        if (!TheWorld.touchingClimbableArea(this)) {
            this.motionMode = "free";
        } else {
            // climbing ladder = constant vertical speed, ignore gravity:
            this.vy = this.climbSpeed;
        }
    } else {
        // When i'm not grabbed onto a ladder, i am affected by
        // forces. starting with gravity:
        if (!this.onGround()) {
	    this.vy += PhysicsConstants.gravity * elapsedTime / 100;
        }

        // other forces:
        var vector = TheWorld.touchingForceFields(this);
        this.vx += vector.x;
        this.vy += vector.y;

        // friction:
        var friction = (this.onGround() ? platform.getFrictionCoefficient() : PhysicsConstants.airFriction);
        if (this.vx > 0) {
            this.vx -= friction * this.vx * elapsedTime / 1000;
            if (this.vx < 0.1) {
                this.vx = 0;
            }
        }
        if (this.vx < 0) {
            this.vx -= friction * this.vx * elapsedTime / 1000;
            if (this.vx > -0.1) {
                this.vx = 0;
            }
        }
    }

    var xDist = this.vx * elapsedTime / 100;
    var yDist = this.vy * elapsedTime / 100;

    if (platform && platform.vx) {
        // if i'm on a horizontally moving platform, scoot me along
        // with it:
      xDist += platform.vx * elapsedTime / 100;
    }

    // Collision detection
    var pathModified = TheWorld.detectPlatformIntercept(this, xDist, yDist);
    if (!pathModified) {
	    // If no collision, move full velocity
      this.move(xDist, yDist);
    }
  },

  jump: function(elapsed) {
	//&& ! TheWorld.touchingPlatform(this, "top")) {
   if (this.onGround() && !this.jumping) {
	// start jump
	playSfx("jump-sfx");
	this.jumping = true;
	this.remainingJumpPower = PhysicsConstants.jumpPower;
	this.vy -= PhysicsConstants.jumpPower;
    }
    if (this.jumping) {
	// track how long we've been holding the key
	var jumpPowerUsed = 20 * elapsed/100;
	if (this.remainingJumpPower > jumpPowerUsed) {
	    this.remainingJumpPower -= jumpPowerUsed;
	} else {
	    this.remainingJumpPower = 0;
	}
    }

  },

  stopJumping: function() {
    this.jumping = false;
    // brake upwards movement
    if (this.remainingJumpPower) {
	this.vy += this.remainingJumpPower;
	this.remainingJumpPower = 0;
    }
  },

  idle: function(elapsed) {
    // slow down when not pushing any direction
    // TODO because this is in idle(), it's only applied to player
    // let's apply to all mobs
    // TODO real friction is nonlinear

    // Also stop climbing velocity:
    this.climbSpeed = 0;
  },

  _getAcceleration: function(direction) {
     var decelerating = (direction == "left" && this.vx > 0) ||
	(direction == "right" && this.vx < 0);  
     if (this.onGround()) {
         var platform = TheWorld.touchingPlatform(this, "bottom");
         // TODO probably running touchingPlatform way moret times per
         // frame than we need to!!!

         return platform.getAccelerationCoefficient();
	 /*if (decelerating) {
	     return PhysicsConstants.groundDeceleration;
	 } else {
	     return PhysicsConstants.groundAcceleration;
	 }*/
     } else {
	 if (decelerating) {
	     return PhysicsConstants.airDeceleration;
	 } else {
	     return PhysicsConstants.airAcceleration;
	 }
     }
 },

  goLeft: function(elapsed) {
    if (! TheWorld.touchingPlatform(this, "left")) {
      this.vx -= this._getAcceleration("left") * elapsed / 100;
      this._pixelsTraveled += elapsed;
      /*if (this.vx < 0 - PhysicsConstants.topSpeed) {
        this.vx = 0 - PhysicsConstants.topSpeed;
      }*/
        // Top speed doesn't need to be applied explicitly if 
        // top speed is determined by balance between running
        // force and friction. However, what's to stop you from
        // accelerating indefinitely in midair?
        // Maybe we should keep top speed a
    }
    this.lastMoved = GOING_LEFT;
  },

  goRight: function(elapsed) {
    if (! TheWorld.touchingPlatform(this, "right")) {
      this._pixelsTraveled += elapsed;
      this.vx += this._getAcceleration("right") * elapsed / 100;
      /*if (this.vx > PhysicsConstants.topSpeed) {
        this.vx = PhysicsConstants.topSpeed;
      }*/
    }
    this.lastMoved = GOING_RIGHT;
  },

  ascend: function(elapsed) {
    if (TheWorld.touchingClimbableArea(this)) {
      this.motionMode = "climb";
      this._pixelsTraveled += elapsed;
      this.climbSpeed = - 10;
      this.vx = 0;
    }
  },

  descend: function(elapsed) {
    if (TheWorld.touchingClimbableArea(this)) {
      this.motionMode = "climb";
      this._pixelsTraveled += elapsed;
      this.climbSpeed = 10;
      this.vx = 0;
    }
  },

  die: function() {
	this.dead = true;
  },

  damage: function(amount) {
    this.hitPoints -= amount;
    if (this.hitPoints <= 0) {
	this.die();
    }
  },

  substantial: function(side) {
    return true;
  }
};
Mob.prototype.__proto__ = new Box();


function Player(loader, filename, x, y, width, height) {
  this.boxInit(x, y, width, height);
  this.mobInit(loader, filename, true);
}
Player.prototype = {
  type: "player",

  hitPoints: 2,
  maxHitPoints: 2,
  mercyInvincibility: 0,
  numTrinkets: 0,

  onMobTouch: function(mob, intercept) {
	// So this is kind of weird.
	// When i touch a monster it might call my onMobTouch method and pass
	// in the monster, or it might call the monster's onMobTouch method
	// and pass in me.  I want it to do the same thing either way.
	// So reflect it back:
	switch (intercept.side) {
	case "top": intercept.side = "bottom";
	break;
	case "bottom": intercept.side = "top";
	break;
	case "left": intercept.side = "right";
	break;
	case "right": intercept.side = "left";
	break;
	}
	mob.onMobTouch(this, intercept);
  },

  damage: function(amount) {
    if (this.mercyInvincibility == 0) {
      this.hitPoints -= amount;
      this.mercyInvincibility = 1000;
      if (this.hitPoints <= 0) {
        this.die();
      }
      $("#hp").html(this.hitPoints);
    }
  },

  heal: function(amount) {
    this.hitPoints += amount;
    if (this.hitPoints > this.maxHitPoints) {
      this.hitPoints = this.maxHitPoints;
    }
    $("#hp").html(this.hitPoints);
  },

  update: function(elapsedTime) {
    Mob.prototype.update.call(this, elapsedTime);
    if (this.mercyInvincibility > 0) {
	this.mercyInvincibility -= elapsedTime;
	if (this.mercyInvincibility < 0) {
	    this.mercyInvincibility = 0;
	}
    }
  },

  draw: function(ctx) {
    if (this.mercyInvincibility > 0) {
      ctx.globalAlpha = 0.5;
    }
    Mob.prototype.draw.call(this, ctx);
    ctx.globalAlpha = 1.0;
  }
}
Player.prototype.__proto__ = new Mob();


function Enemy(loader) {
  this.direction = "left";
}
Enemy.prototype = {
  roam: function(elapsed) {
    if (this.direction == "left" &&
	(TheWorld.touchingPlatform(this, "left") != null)) {
	this.direction = "right";
    } else if (this.direction == "right" &&
       (TheWorld.touchingPlatform(this, "right") != null)) {
	this.direction = "left";
    }

    // change direction when you hit a ledge/edge of platform:
    var underMe = TheWorld.touchingPlatform(this, "bottom");
    if (underMe) {
	if (this.direction == "left" &&
	    (this.left - underMe.left < 10) ) {
	    this.direction = "right";
	}
	if (this.direction == "right" &&
	    (underMe.right - this.right < 10) ) {
	    this.direction = "left";
	}
    }

    if (this.direction == "left") {
	this.goLeft(elapsed);
    } else if (this.direction == "right") {
	this.goRight(elapsed);
    }

  },
  onMobTouch: function(mob, intercept) {
    // If touch player, hurt player if touching from the
    // side; kill enemy if player jumps on its head.
    if (mob.type == "player") {
      var player = mob;
      if (intercept.side == "top") {
        this.damage(1);
        player.vy = -10; // bounce
        playSfx("crunch-sfx");
      } else {
        player.damage(1);

	// Knockback:
	player.vy = -10;
	if (intercept.side == "left") {
	    player.vx = -10;
	} else if (intercept.side == "right") {
	    player.vx = 10;
	}
	// TODO this is slightly buggy as it can bounce the player
	// through a solid wall!
      }
    }
    return true;
    // TODO return true or false? stop mob at intercept?
  }
};
Enemy.prototype.__proto__ = new Mob();

function MagicCarpet(loader) {
}
MagicCarpet.prototype = {
  type: "magic_carpet",
  classification: "obstacle",
  vx: 0,

  draw: function(ctx) {
    ctx.fillStyle = "red";
    ctx.strokeStyle = "black";
    ctx.fillRect(this.left, this.top, this.width, this.height);
    ctx.strokeRect(this.left, this.top, this.width, this.height);
  },

  onMobTouch: function(mob, intercept) {
    mob.stopAt(intercept);
     if (intercept.side == "top" && mob.type == "player" && !TheWorld.touchingPlatform(this, "right")) {
	 this.vx = 5;
    } else {
      this.vx = 0;
    }
    return true;

  },

  update: function(elapsedTime) {
    var xDist = this.vx * elapsedTime / 100;
    var pathModified = TheWorld.detectPlatformIntercept(this, xDist, 0);
    if (!pathModified) {
      this.left += xDist;
    }
  }
}
MagicCarpet.prototype.__proto__ = new Mob();
ConstructorRegistry.register(MagicCarpet);

function DefineEnemy(options) {
    var constructor = function(loader) {
	this.mobInit(loader, options.imageUrl, !(!options.animated));
    };
    constructor.prototype = {
	type: options.name,
	width: options.width ? options.width : 64,
        height: options.height ? options.height : 64,
        classification: "monster",
        imageUrl: options.imageUrl
    };
    // TODO any crazy thing the options has should go in the prototype
    constructor.prototype.__proto__ = new Enemy();
    ConstructorRegistry.register(constructor);

    // More things that should be overridable by this function:
    // roam(), update(), draw(), onMobTouch()
}


DefineEnemy({
  name: "octogoblin",
  width: 73,
  height: 62,
  imageUrl: "octogoblin.png"
});

DefineEnemy({
  name: "dino",
  animated: true,
  width: 96,
  height: 64,
  imageUrl: "running_chaos_frames.png"
});

DefineEnemy({
  name: "shrimp",
  width: 91,
  height: 49,
  imageUrl: "shrimp.gif"
});


