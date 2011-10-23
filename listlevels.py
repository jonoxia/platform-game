#!/usr/bin/python

# This script takes a username and spits out a list of links to all
# works drawn by that user.
import cgi
import cgitb

from database_tables import Level, LevelObject
from webserver_utils import render_template_file

def printList():
    print "Content-type: text/html"
    print

    matches = Level.select(orderBy = "-modified")
    work_list = ""
    for match in matches:
        title = match.name
        url = "webrunner.html?level=%s" % title
        date = match.modified
        work_list += render_template_file( "list-level-row.html",
                                           {"moddate": date,
                                            "title": title} )
    
    print render_template_file( "list-levels.html", {"work_list": work_list})

if __name__ == "__main__":
    cgitb.enable()
    q = cgi.FieldStorage()

    # artist = verify_id()
    # action = q.getfirst("action", "")
    # title = q.getfirst("title", "")

    printList()


