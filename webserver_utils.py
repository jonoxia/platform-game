#!/usr/bin/python

import Cookie
import os
import sys
import string
import simplejson
import re
from platformer_config import TEMPLATE_DIR
from database_tables import Player

def render_template_file( filename, substitutionDict ):
    # Localization TODO read strings.json once
    string_file = open( "strings.json", "r")
    strings = simplejson.loads(string_file.read())
    string_file.close()
    localized_strings = strings["en"] # TODO get language from settings
   
    # find everything that matches ${_stuff}
    template_file = open( os.path.join( TEMPLATE_DIR, filename ), "r")
    template_file_contents = template_file.read()
    template_file.close()

    localizations = re.findall(r"\$\{(\_[^}]*)\}", template_file_contents)
    for key in localizations:
      substitutionDict[key] = localized_strings[key]
    template = string.Template(template_file_contents)
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
