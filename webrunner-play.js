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
    var player = new Mob(avatarURL,
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

	    TheWorld.updateEveryone();
	    TheWorld.scrollIfNeeded(player);

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