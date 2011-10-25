#!/usr/bin/python

# The JS from the sign in button needs to XHR the assertion to this code here
# login.py will then verify it against the browserID server  
# see https://browserid.org/developers
# if that works then we generate a session id
# store session id in a row in the users table along with username and email address
# redirect to listworks.py  (or back to index.html if login fails)

import cgi
import cgitb
import uuid
import Cookie
import subprocess
import simplejson
from database_tables import Player
from platformer_config import DOMAIN, DEFAULT_AVATAR_URL

def verifyBrowserId(assertion):
    postargs = "assertion=%s&audience=%s" % (assertion, DOMAIN)
    url = "https://browserid.org/verify"
    # TODO verify SSL?
    process = subprocess.Popen(["curl", "-d", postargs, url],
                               stdout = subprocess.PIPE )
    data = simplejson.loads(process.communicate()[0])
    # expect browserid.org/verify to return fields like this:{
    #    "status": "okay",
    #    "email": "lloyd@mozilla.com",
    #    "audience": "mysite.com",
    #    "valid-until": 1308859352261,
    #    "issuer": "browserid.org:443"
    if data["status"] == "okay":
        return data["email"]
    else:
        return False

if __name__ == "__main__":
    cgitb.enable()
    q = cgi.FieldStorage()
    print "Content-type: text/html"
    print

    assertion = q.getfirst("assertion", "")

    email = verifyBrowserId(assertion)
    if (email == False):
        print simplejson.dumps({"logged_in": "false"})
    else:
        session = str(uuid.uuid1())

        matches = Player.selectBy( email = email )
        if (matches.count() == 0):
            # user has not logged in before: create account
            kwargs = {"email": email,
                      "name": email.split("@")[0],  # use first part of email address as username
                      "session": session,
                      "avatarURL": DEFAULT_AVATAR_URL}
            newUser = Player(**kwargs)
        else:
            oldUser = matches[0]
            oldUser.session = session
         
        # Return JSON to the client's XHR containing email and session uuid
        print simplejson.dumps({"logged_in": "true", "email": email, "session": session})
            
