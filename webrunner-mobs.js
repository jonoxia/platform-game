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
  type: "player",

  // Stats (could be modified by powerups):
  topSpeed: 122,
  gravity: 5,
  acceleration: 2, // make this 3 for a much easier to steer dude
  friction: 4,
  jumpPower: 30,

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
    }
  },

  erase: function(ctx) {
    ctx.clearRect(this.left, this.top, this.width, this.height);
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
      this.left += dx;
      this.top += dy;
    }
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
        this.left = intercept.x;
        this.top = intercept.y - this.height;
        break;
      case "left":
        this.vx = 0;
        this.left = intercept.x - this.width;
        this.top = intercept.y;
        break;
      case "right":
        this.vx = 0;
        this.left = intercept.x;
        this.top = intercept.y;
        break;
      case "bottom":
        this.vy = 0;
        this.left = intercept.x;
        this.top = intercept.y;
        break;
      }	
  },

  update: function() {
    // Gravity:
    if (!this.onGround()) {
      this.vy += this.gravity;
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
      this.vy -= this.jumpPower;
      this.jumping = true; // to make jump idempotent, fix bug 2
    }
  },

  idle: function() {
    // Apply friction if touching ground:
    if (this.onGround()) {
      if (this.vx > 0) {
        this.vx -= this.friction;
        if (this.vx < 0) {
          this.vx = 0;
        }
      }

      if (this.vx < 0) {
        this.vx += this.friction;
        if (this.vx > 0) {
          this.vx = 0;
        }
      }
    }
  },

  goLeft: function() {
    if (! TheWorld.touchingPlatform(this, "left")) {
      if (this.vx > 0 - this.topSpeed) {
        this.vx -= this.acceleration;
      } else {
        this.vx = 0 - this.topSpeed;
      }
    }
  },

  goRight: function() {
    if (! TheWorld.touchingPlatform(this, "right")) {
      if (this.vx < this.topSpeed) {
        this.vx += this.acceleration;
      } else {
        this.vx = this.topSpeed;
      }
    }
  },

  intersecting: function(rect) {
	// todo move to box class?
      return (this.left <= rect.right && this.right >= rect.left
	      && this.top <= rect.bottom && this.bottom >= rect.top );
    },

  onMobTouch: function(mob, intercept) {
	// override this if you want to do something
    }
};
Mob.prototype.__proto__ = new Box();



function Enemy() {
  this.mobInit("/platformer-dev/shrimp.gif", false);
  this.direction = "left";
}
Enemy.prototype = {
  type: "shrimp",

  roam: function() {
    if (this.direction == "left" && TheWorld.touchingPlatform(this, "left")) {
	this.direction = "right";
    } else if (this.direction == "right" && TheWorld.touchingPlatform(this, "right")) {
	this.direction = "left";
    }

    if (this.direction == "left") {
	this.goLeft();
    } else if (this.direction == "right") {
	this.goRight();
    } 
  },
  onMobTouch: function(mob, intercept) {
    // TODO if touch player, hurt player if touching from the
    // side; kill enemy if player jumps on its head.
  }
};
Enemy.prototype.__proto__ = new Mob();
ConstructorRegistry.register(Enemy);

