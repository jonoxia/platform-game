#!/usr/bin/python
from webserver_utils import verify_id, print_redirect

import cgi
import cgitb

cgitb.enable()
q = cgi.FieldStorage()
playerName = q.getfirst("playerName", "")
avatarURL = q.getfirst("avatarURL", "")
langPref = q.getfirst("langPref", "")
player = verify_id() 

if (playerName != "" and avatarURL != "" and player != None):
    player.name = playerName
    player.avatarURL = avatarURL
    if langPref != "":
        player.langPref = langPref
    print_redirect("listlevels.py")
