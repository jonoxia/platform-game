#!/usr/bin/python
from database_tables import LevelObject
# from webserver_utils import verify_id

import cgi
import cgitb
# import datetime
import simplejson

# artist = verify_id() 

worldData = []

objs = LevelObject.select()
for obj in objs:
    worldData.append({"x": obj.x, "y": obj.y, "width": obj.width, "height": obj.height})

print "Content-type: text/html"
print
print simplejson.dumps(worldData)
