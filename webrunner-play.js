const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW =38;
const SPACEBAR =32;

function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.9;
    TheWorld.canvasHeight = screenHeight * 0.9;

    $("#game-canvas").attr("width", TheWorld.canvasWidth);
    $("#game-canvas").attr("height", TheWorld.canvasHeight);
}

var StatusBar = {
  updateTimer: function(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    if (s < 10) {
	s_str = "0" + s;
    } else {
	s_str = s;
    }
    $("#timer").html( m + ":" + s_str);
  },

  draw: function(ctx, player) {
    // inside the top left of the canvas, draw:
    // elapsed time
    // collected trinkets
    // hearts
    var maxHP = player.maxHitPoints;
    var hp = player.hitPoints;
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(20, 20);
    ctx.arc(30, 20, 10, Math.PI, 0, false);
    ctx.arc(50, 20, 10, Math.PI, 0, false);
    ctx.lineTo(40, 40);
    ctx.fillStyle = "black";
    ctx.fill();

    if (hp >= 1) {
	ctx.beginPath();
	ctx.moveTo(40, 38);
	ctx.lineTo(22, 20);
	ctx.arc(30, 20, 8, Math.PI, 0, false);
	if (hp >= 2) {
	    ctx.arc(50, 20, 8, Math.PI, 0, false);
	    ctx.lineTo(40, 38);
	}
	ctx.fillStyle = "red";
	ctx.fill();
    }
  }
};

var progressBar;

function startGame(loader) {

  if (TheWorld.musicUrl != "") {
    $("#bgm").attr("src", TheWorld.musicUrl);
    $("#bgm")[0].play();
  }

  adjustToScreen();
  progressBar.draw(0.5);

  // Call adjustToScreen if screen size changes
  var resizeTimer = null;
  $(window).resize(function() {
      if (resizeTimer) {
          clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(adjustToScreen, 500);
  });

  var avatarURL = $("#avatarURL").html();
  var context = $("#game-canvas")[0].getContext("2d");

  // Create player, put it in the world:
  var player = new Player(loader,
			  avatarURL,
                          TheWorld.startX,
			  TheWorld.startY,
			  64, 64);
  TheWorld.addForegroundObject(player);
  //TheWorld.draw(context);

  $("#hp").html(player.hitPoints);

  var leftArrowDown = false;
  var rightArrowDown = false;
  var spacebarDown = false;

  var startTime = Date.now();

  $(document).bind("keydown", function(evt) {
     if (evt.which == LEFT_ARROW) {
       leftArrowDown = true;
     }
     if (evt.which == RIGHT_ARROW) {
       rightArrowDown = true;
     }
     if (evt.which == SPACEBAR) {
       spacebarDown = true;
     }
    });
  $(document).bind("keyup", function(evt) {
    if (evt.which == LEFT_ARROW) {
	leftArrowDown = false;
    }
    if (evt.which == RIGHT_ARROW) {
	rightArrowDown = false;
    }
    if (evt.which == SPACEBAR) {
	spacebarDown = false;
    }
  });

  var bottomLimit = TheWorld.getBottomLimit();
  var currentTime = Date.now();
  var elapsed = 0;
  var newTime;
  var mainLoop = function() {
    newTime = Date.now();
    elapsed = newTime - currentTime;
    currentTime = newTime;

    if (spacebarDown) {
      player.jump(elapsed);
    } else {
       player.stopJumping(elapsed);
    }

    if (leftArrowDown && !rightArrowDown) {
      player.goLeft(elapsed);
    } else if (rightArrowDown && !leftArrowDown) {
      player.goRight(elapsed);
    } else {
       player.idle(elapsed);
    }
	
    TheWorld.updateEveryone(elapsed);
    TheWorld.scrollIfNeeded(player);
    TheWorld.cleanUpDead();

    StatusBar.updateTimer(currentTime - startTime);
    TheWorld.draw(context);
    StatusBar.draw(context, player);
    // check for #WINNING:
    if (player.intersecting(TheWorld.goalArea)) {
      $("#output").html(getLocalString("_winning"));
      // stop bgm, play victory sound effects!
      $("#bgm")[0].pause();
      playSfx("victory-sfx");
      $.ajax({type: "POST", 
		url: "complete-level.py",
		data: {levelName: gup("level"),
		      completionTime: Date.now() - startTime,
		      trinkets: player.numTrinkets},
		success: function(data, textStatus, jqXHR) {
		    $("#debug").html(data);
                },
		error: function(data, textStatus, thing) {
		    $("#debug").html(thing);
	        },
		  dataType: "text"
		  });
      $("#debug").html(getLocalString("_saving_score"));
    }
    // check for #LOSING:
    else if (player.dead) {
	$("#output").html(getLocalString("_lose_monster") + " " +
			  getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else if (player.top > bottomLimit) {
	$("#output").html(getLocalString("_lose_falling") + " " + 
			  getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else {
      window.requestAnimFrame(mainLoop);
    }
  };

  loader.loadThemAll(mainLoop, function(progress) {
      progressBar.draw(0.5 + 0.5 * progress);
    });
}


$(document).ready(function() {
  var loader = new AssetLoader();
  progressBar = new ProgressBar($("#game-canvas")[0].getContext("2d"));
  progressBar.draw(0);
  // Playing online or offline?
  if (typeof offlineLevelData != "undefined") {
    TheWorld.loadFromString(offlineLevelData, loader, startGame);
  } else {
    var title = gup("level");
    TheWorld.loadFromServer(title, loader, startGame);
  }

});