#!/usr/bin/python

import Cookie
import os
import sys
import string
from platformer_config import TEMPLATE_DIR
from database_tables import Player

def render_template_file( filename, substitutionDict ):
    file = open( os.path.join( TEMPLATE_DIR, filename ), "r")
    template = string.Template(file.read())
    file.close()
    return template.substitute( substitutionDict )

def print_redirect(url, cookie = None):
    print "Status: 302" # temporary redirect
    if cookie:
        print cookie
    print "Location: " + url
    print

def logout():
    artist = verify_id()
    artist.session = ""
    antimatter_cookie = Cookie.SimpleCookie()
    antimatter_cookie["email"] = artist.email
    antimatter_cookie["email"]["expires"] = 0
    antimatter_cookie["session"] = artist.session
    antimatter_cookie["session"]["expires"] = 0
    print_redirect("index.html", antimatter_cookie)

def verify_id():
    if os.environ.has_key('HTTP_COOKIE'):
        cookie = Cookie.SimpleCookie(os.environ['HTTP_COOKIE'])
        if cookie.has_key("email") and cookie.has_key("session"):
            matches = Player.selectBy(email = cookie["email"].value,
                                      session = cookie["session"].value)
            if matches.count() > 0:
                if matches[0].session != "":
                    return matches[0]

    # If verification fails, kick 'em back out to index.html
    print_redirect("index.html")
    sys.exit(1)
