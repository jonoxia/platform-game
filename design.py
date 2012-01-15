#!/usr/bin/python
from database_tables import Level
from webserver_utils import *

import cgi
import cgitb

cgitb.enable()
q = cgi.FieldStorage()

player = verify_id()
levelName = q.getfirst("level", "")

data = {}
worldData = []

levels = Level.selectBy(name = levelName)
if levels.count() > 0:
    level = levels[0]
    print "Content-type: text/html"
    print
    print render_template_file("design.html", {"level_name": levelName})
else:
    print_redirect("listlevels.py")
