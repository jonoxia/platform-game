#!/usr/bin/python

# This script takes a username and spits out a list of links to all
# works drawn by that user.
import cgi
import cgitb

from database_tables import Level, LevelObject
from webserver_utils import render_template_file, verify_id

def printList(player):
    print "Content-type: text/html"
    print

    matches = Level.select(orderBy = "-modified")
    work_list = ""
    for match in matches:
        title = match.name
        date = match.modified
        edit_link = ""
        if match.creator != None:
            if match.creator == player:
                creator = "You"
                edit_link = "<a href=\"designer.html?level=%s\">Edit</a>" % title
            else:
                creator = match.creator.name
        else:
            creator = "Nobody"
        work_list += render_template_file( "list-level-row.html",
                                           {"moddate": date,
                                            "title": title,
                                            "creator": creator,
                                            "editlink": edit_link} )
    
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


