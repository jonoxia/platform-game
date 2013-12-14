const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW = 38;
const SPACEBAR = 32;

function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.9;
    TheWorld.canvasHeight = screenHeight * 0.9;

    $("#game-canvas").attr("width", TheWorld.canvasWidth);
    $("#game-canvas").attr("height", TheWorld.canvasHeight);
}

function bannerText(text) {
  var ctx = $("#game-canvas")[0].getContext("2d");
  ctx.font="36pt arial";
  ctx.fillStyle = "black";
  //var textWidth = ctx.measureText(text);
  ctx.fillText(text, 100, TheWorld.canvasHeight/2 - 50);
}

var StatusBar = {
  timeString: "",
  updateTimer: function(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    if (s < 10) {
	s_str = "0" + s;
    } else {
	s_str = s;
    }
    this.timeString = m + ":" + s_str;
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

    ctx.font="18pt arial";
    ctx.fillStyle = "black";
    //var textWidth = ctx.measureText(text);
    ctx.fillText(getLocalString("_time") + ": " + this.timeString, 80, 30);

    ctx.fillText(getLocalString("_useless_trinkets") + ": " + player.numTrinkets, 240, 30);
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

  var leftArrowDown = false;
  var rightArrowDown = false;
  var spacebarDown = false;
  var gameStarted = false;

  var startTime = Date.now();

  $(document).bind("keydown", function(evt) {
    gameStarted = true;
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

    // Show instructions on screen until player starts moving:
    if (!gameStarted) {
      bannerText(getLocalString("_game_instructions"));
    }

    // check for #WINNING:
    if (player.intersecting(TheWorld.goalArea)) {
      bannerText(getLocalString("_winning"));
      // stop bgm, play victory sound effects!
      $("#bgm")[0].pause();
      playSfx("victory-sfx");
      if (!offlineMode) {
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
    }
    // check for #LOSING:
    else if (player.dead) {
	bannerText(getLocalString("_lose_monster") + " " +
		   getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else if (player.top > bottomLimit) {
	bannerText(getLocalString("_lose_falling") + " " +
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


var offlineMode;
$(document).ready(function() {
  var loader = new AssetLoader();
  progressBar = new ProgressBar($("#game-canvas")[0].getContext("2d"));
  progressBar.draw(0);
  // Playing online or offline?
  if (typeof offlineLevelData != "undefined") {
    offlineMode = true;
    TheWorld.loadFromString(offlineLevelData, loader, startGame);
  } else {
    offlineMode = false;
    var title = gup("level");
    TheWorld.loadFromServer(title, loader, startGame);
  }

});