const GOING_LEFT = 0;
const GOING_RIGHT = 1;
const STAND_STILL = 2;

function Mob(filename, x, y, width, height, animate) {
  if (filename) {
    this.boxInit(x, y, width, height);
    this.mobInit(filename, animate);
  }
}
Mob.prototype = {
  imgLoaded: false,
  dead: false,
  _pixelsTraveled: 0,

  // Stats (could be modified by powerups):
  topSpeed: 122,
  gravity: 7,
  acceleration: 3,
  friction: 4,
  jumpPower: 40,
  hitPoints: 1,
  jumping: false,

  mobInit: function(filename, animate) {
    var self = this;
    this.img = new Image();
    this.img.onload = function() {
      self.imgLoaded = true;
    };
    this.img.src = filename;

    this.vx = 0;
    this.vy = 0;

    this.isAnimated = animate;
    if (animate) {
	this.animationFrame = 0;
	this.movementDirection = STAND_STILL;
    }
  },

  draw: function(ctx) {
    if (this.imgLoaded) {
      if (this.isAnimated) {
        var spriteOffsetX = this.width * this.animationFrame;
        var spriteOffsetY = this.height * this.movementDirection;
        ctx.drawImage(this.img, spriteOffsetX, spriteOffsetY, this.width, this.height,
                      this.left, this.top, this.width, this.height);
      } else {
        ctx.drawImage(this.img, this.left, this.top);
      }
    } else {
	// if img not loaded yet, draw an empty box
	ctx.strokeStyle = "black";
	ctx.strokeRect(this.left, this.top, this.width, this.height);
    }
  },

  erase: function(ctx) {
    ctx.clearRect(this.left, this.top, this.width, this.height);
  },

  move: function(dx, dy) {
	// advancing 12 pixels = 1 frame
    this._pixelsTraveled += Math.abs(dx);
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
      playSfx("bonk-sfx")
        break;
      case "right":
        this.vx = 0;
        this.left = intercept.x;
        this.top = intercept.y;
      playSfx("bonk-sfx")
        break;
      case "bottom":
        this.vy = 0;
        this.left = intercept.x;
        this.top = intercept.y;
      playSfx("bonk-sfx")
        break;
      }	
  },

  update: function(elapsedTime) {
    // Gravity:
    if (!this.onGround()) {
	this.vy += this.gravity * elapsedTime / 100;
    }
    
    var xDist = this.vx * elapsedTime / 100;
    var yDist = this.vy * elapsedTime / 100;
    
    var platform = TheWorld.touchingPlatform(this, "bottom");
    if (platform && platform.vx) {
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
	this.remainingJumpPower = this.jumpPower;
	this.vy -= this.jumpPower;
    }
    if (this.jumping) {
	// track how long we've been holding the key
	var jumpPowerUsed = 20 * elapsed/100;
	if (this.remainingJumpPower > jumpPowerUsed) {
	    this.remainingJumpPower -= jumpPowerUsed;
	    //$("#debug").html(this.remainingJumpPower); // alwasy prints 20
	    // which is this.jumpPower - 10.
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
    // Apply friction if touching ground:
    if (this.onGround()) {
      if (this.vx > 0) {
        this.vx -= this.friction * elapsed / 100;
        if (this.vx < 0) {
          this.vx = 0;
        }
      }

      if (this.vx < 0) {
        this.vx += this.friction * elapsed / 100;
        if (this.vx > 0) {
          this.vx = 0;
        }
      }
    }
  },

  goLeft: function(elapsed) {
    if (! TheWorld.touchingPlatform(this, "left")) {
      var acceleration = this.acceleration;
      if (this.onGround()) { // add friction when on ground
        acceleration += this.friction;
      }
      this.vx -= acceleration * elapsed / 100;

      if (this.vx < 0 - this.topSpeed) {
        this.vx = 0 - this.topSpeed;
      }
    }
  },

  goRight: function(elapsed) {
    if (! TheWorld.touchingPlatform(this, "right")) {
      var acceleration = this.acceleration;
      if (this.onGround()) { // add friction when on ground
        acceleration += this.friction;
      }

      this.vx += acceleration * elapsed / 100;

      if (this.vx > this.topSpeed) {
        this.vx = this.topSpeed;
      }
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


function Player(filename, x, y, width, height) {
  this.mobInit(filename, true);
  this.boxInit(x, y, width, height);
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


function Enemy() {
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

function Shrimp() {
  this.mobInit("shrimp.gif", false);
}
Shrimp.prototype = {
  type: "shrimp",
  width: 91,
  height: 49,
};
Shrimp.prototype.__proto__ = new Enemy();
ConstructorRegistry.register(Shrimp);


function MagicCarpet() {  
}
MagicCarpet.prototype = {
  type: "magic_carpet",
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



function Octogoblin() {
  this.mobInit("octogoblin.png", false);
}
Octogoblin.prototype = {
  type: "octogoblin",
  width: 73,
  height: 62,
};
Octogoblin.prototype.__proto__ = new Enemy();
ConstructorRegistry.register(Octogoblin);

function Dino() {
  this.mobInit("running_chaos_frames.png", true);
}
Dino.prototype = {
  type: "dino",
  width: 96,
  height: 64,
};
Dino.prototype.__proto__ = new Enemy();
ConstructorRegistry.register(Dino);

