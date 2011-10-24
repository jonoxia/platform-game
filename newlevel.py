#!/usr/bin/python

# This script takes a username and spits out a list of links to all
# works drawn by that user.
import cgi
import cgitb
import datetime

from database_tables import Level
from webserver_utils import render_template_file, print_redirect


def level_exists(name):
    matches = Level.selectBy(name = name)
    return (matches.count() > 0)

def make_new_title(base_title):
    title = base_title
    num = 0
    while level_exists(title):
        num += 1
        title = "%s_%d" % (base_title, num)
    return title

if __name__ == "__main__":
    cgitb.enable()
    q = cgi.FieldStorage()

    # artist = verify_id()
    # action = q.getfirst("action", "")
    title = q.getfirst("title", "")
    if title == "":
        title = "Untitled"
    title = title.replace(" ", "_") # workaround for bug 9
    title = make_new_title(title)
    newLevel = Level(name=title, creator = None, modified=datetime.datetime.now(), startX = 0, startY = 0)

    print_redirect("listlevels.py")
