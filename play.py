#!/usr/bin/python
from database_tables import Level
from webserver_utils import *

import cgi
import cgitb
import datetime
import simplejson

cgitb.enable()
q = cgi.FieldStorage()

player = verify_id()
levelName = q.getfirst("level", "")

data = {}
worldData = []

levels = Level.selectBy(name = levelName)
if levels.count() > 0:
    level = levels[0]
    if (level.creator == player):
        editLink = "<a href=\"designer.html?level=%s\">Edit This Level</a>" % levelName
    elif (level.creator != None):
        editLink = "Created by %s." % level.creator.name
    else:
        editLink = ""
    print "Content-type: text/html"
    print
    print render_template_file("play.html", {"playerName": player.name,
                                             "avatarURL": player.avatarURL,
                                             "levelName": levelName,
                                             "editLink": editLink})
else:
    print_redirect("listlevels.py")
