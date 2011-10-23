#!/usr/bin/python
from database_tables import LevelObject
# from webserver_utils import verify_id

import cgi
import cgitb
# import datetime
import simplejson

cgitb.enable()
q = cgi.FieldStorage()
levelObj = q.getfirst("levelObj", "")
# artist = verify_id() 

if levelObj != "":
    # delete all the old ones first!!
    all = LevelObject.select()
    for obj in all:
        LevelObject.delete(obj.id)
    worldData = simplejson.loads(levelObj);
    for obj in worldData:
        l = LevelObject(level = None, type = obj["type"],
                        x = obj["x"], y = obj["y"],
                        width = obj["width"], height = obj["height"])

print "Content-type: text/html"
print
print "OK, saved"
