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
    var player = new Player(avatarURL,
			 TheWorld.startX,
			 TheWorld.startY,
			 64, 64);
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

    var bottomLimit = TheWorld.getBottomLimit();
    if (TheWorld.musicUrl != "") {
	$("#bgm").attr("src", TheWorld.musicUrl);
	$("#bgm")[0].play();
    }

    var currentTime = Date.now();
    var elapsed = 0;
    var newTime;
    var mainLoop = function() {
	if (leftArrowDown && !rightArrowDown) {
	    player.goLeft();
	} else if (rightArrowDown && !leftArrowDown) {
	    player.goRight();
	} else {
	    player.idle();
	}

	newTime = Date.now();
	elapsed = newTime - currentTime;
	currentTime = newTime;
	
	TheWorld.updateEveryone(elapsed);
	TheWorld.scrollIfNeeded(player);
	TheWorld.cleanUpDead();

	updateTimer(currentTime - startTime);
	TheWorld.draw(context);
	// check for #WINNING:
	if (player.intersecting(TheWorld.goalArea)) {
	    $("#output").html("A WINRAR IS YOU!");
	    $("#bgm")[0].pause();
	    playSfx("victory-sfx");
	    // TODO play victory sound effects!
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
	// check for #LOSING:
	else if (player.dead) {
	    $("#output").html("YOU'RE MONSTER CHOW (reload to play again)");
	    $("#bgm")[0].pause();
	    playSfx("death-sfx");
	} else if (player.top > bottomLimit) {
	    $("#output").html("GRAVITY IS A HARSH MISTRESS (reload to play again)");
	    $("#bgm")[0].pause();
	    playSfx("death-sfx");
	} else {
	    requestAnimationFrame(mainLoop);
	}

    }


    mainLoop();
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