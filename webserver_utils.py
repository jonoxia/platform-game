#!/usr/bin/python

import Cookie
import os
import sys
import string
import simplejson
import re
import l10n
from platformer_config import TEMPLATE_DIR
from database_tables import Player

def render_template_file( filename, substitutionDict ):   
    # find everything that matches ${_stuff}
    template_file = open( os.path.join( TEMPLATE_DIR, filename ), "r")
    template_file_contents = template_file.read()
    template_file.close()

    localizations = re.findall(r"\$\{(\_[^}]*)\}", template_file_contents)

    loc_strings = l10n.getStrings()
    for key in localizations:
      substitutionDict[key] = loc_strings[key].encode("utf-8")

    if re.search(r"\$\{localized\_strings\}", template_file_contents) != None:
        substitutionDict["localized_strings"] = simplejson.dumps(loc_strings)

    template = string.Template(template_file_contents)
    return template.safe_substitute( substitutionDict )

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
