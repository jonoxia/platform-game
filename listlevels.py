#!/usr/bin/python
from __future__ import division

# This script takes a username and spits out a list of links to all
# works drawn by that user.
import cgi
import cgitb
import math

from database_tables import Level, LevelObject, Score
from webserver_utils import render_template_file, verify_id

def formatTime(ms):
    s = math.floor(ms / 1000)
    ms = ms % 1000
    m = math.floor(s / 60)
    s = s % 60
    return "%d:%2d.%2d" % (m, s, ms)

def printList(player):
    print "Content-type: text/html"
    print

    matches = Level.select(orderBy = "-modified")
    work_list = ""
    for level in matches:
        title = level.name
        date = level.modified
        edit_link = ""
        if level.creator != None:
            if level.creator == player:
                creator = "You"
                edit_link = "<a href=\"designer.html?level=%s\">Edit</a>" % title
            else:
                creator = level.creator.name
        else:
            creator = "Nobody"
            
        scores = Score.selectBy(level = level)
        best = ""
        if (scores.count() > 0):
            best = "%s by %s" % (formatTime(scores[0].completionTime), scores[0].player.name)
        else:
            best = "Nobody Yet!"
        scores = Score.selectBy(player = player, level = level)
        your_time = ""
        if (scores.count() > 0):
            your_time = formatTime(scores[0].completionTime)
        work_list += render_template_file( "list-level-row.html",
                                           {"moddate": date,
                                            "title": title,
                                            "creator": creator,
                                            "editlink": edit_link,
                                            "best": best,
                                            "yourtime": your_time} )
    
    print render_template_file( "list-levels.html", {"work_list": work_list,
                                                     "player": player.name,
                                                     "avatarURL": player.avatarURL})

if __name__ == "__main__":
    cgitb.enable()
    q = cgi.FieldStorage()

    player = verify_id()
    # action = q.getfirst("action", "")
    # title = q.getfirst("title", "")

    printList(player)


