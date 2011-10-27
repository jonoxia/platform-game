#!/usr/bin/python
from webserver_utils import verify_id, print_redirect

import cgi
import cgitb

cgitb.enable()
q = cgi.FieldStorage()
playerName = q.getfirst("playerName", "")
avatarURL = q.getfirst("avatarURL", "")
player = verify_id() 

if (playerName != "" and avatarURL != "" and player != None):
    player.name = playerName
    player.avatarURL = avatarURL
    print_redirect("listlevels.py")
