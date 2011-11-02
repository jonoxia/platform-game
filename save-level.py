#!/usr/bin/python
from database_tables import LevelObject, Level
from webserver_utils import verify_id, print_redirect

import cgi
import cgitb
import datetime
import simplejson

cgitb.enable()
q = cgi.FieldStorage()
levelData = q.getfirst("levelData", "")
levelName = q.getfirst("levelName", "")
player = verify_id() 

if levelData != "" and levelName != "":
    
    # if level doesn't exist create it:
    levels = Level.selectBy(name = levelName)
    if levels.count() > 0:
        level = levels[0]
        level.modified = datetime.datetime.now()
    else:
        level = Level(name = levelName,
                      creator = player,
                      modified = datetime.datetime.now(),
                      startX = 0,
                      startY = 0)

    # verify that I am owner of level i.e. allowed to edit:
    if player == level.creator:
        # delete all the old ones first!!
        old = LevelObject.selectBy(level = level)
        for obj in old:
            LevelObject.delete(obj.id)
        data = simplejson.loads(levelData)
        level.startX = data["startX"]
        level.startY = data["startY"]
        level.bgUrl = data["bgUrl"]
        level.musicUrl = data["musicUrl"]
        level.goalUrl = data["goalUrl"]
        level.tilesetUrl = data["tilesetUrl"]
      
        for obj in data["worldData"]:
            l = LevelObject(level = level, type = obj["type"],
                            x = obj["x"], y = obj["y"],
                            width = obj["width"], height = obj["height"])
        print "Content-type: text/html"
        print
        print "OK, saved %s" % levelName

    else:
        print "Content-type: text/html"
        print
        print "You are not logged in as the creator of this level."
   
