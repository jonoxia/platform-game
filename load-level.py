#!/usr/bin/python
from database_tables import LevelObject, Level
# from webserver_utils import verify_id

import cgi
import cgitb
# import datetime
import simplejson

cgitb.enable()
q = cgi.FieldStorage()
levelName = q.getfirst("levelName", "")
# artist = verify_id() 

worldData = []

levelName = q.getfirst("levelName", "")
levels = Level.selectBy(name = levelName)
if levels.count() > 0:
    objs = LevelObject.selectBy(level = levels[0])
    for obj in objs:
        worldData.append({"x": obj.x, "y": obj.y, "width": obj.width, "height": obj.height,
                          "type": obj.type})

print "Content-type: text/html"
print
print simplejson.dumps(worldData)
