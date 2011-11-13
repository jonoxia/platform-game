
function doBrowserIdLogin() {
    navigator.id.getVerifiedEmail(function(assertion) {
        if (assertion) {
            // This code will be invoked once the user has successfully
	    // selected an email address they control to sign in with.
	    $.ajax({url: "login.py",
                    data: {"assertion": assertion},
                    type: "POST",
		    success: function(data, textStatus) {
			var json = JSON.parse(data);
                        if (json["logged_in"] == "true") {
                            // Set cookie with email and sessionID and redirect
                            // to listlevels.py.
			    document.cookie = "email=" + json["email"];
			    document.cookie = "session=" + json["session"];
			    document.location = "listlevels.py";
			} else {
			    $("#debug").html("Login rejected.");
			}
                    },
                    error: function(req, textStatus, error) {
		        $("#debug").html(error);
	            },
		    dataType: "html"});
        } else {
	    $("#debug").html("BrowserID login failed.");
            // something went wrong!  the user isn't logged in.
        }
    });
}