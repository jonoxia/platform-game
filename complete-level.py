#!/usr/bin/python
# Save user's score for completing level

# NOTE TO SELF how do we prevent people from just posting scores to this
# URL that they didn't actually earn?

from database_tables import Level, Score
from webserver_utils import verify_id

import cgi
import cgitb
import datetime

cgitb.enable()
q = cgi.FieldStorage()
levelName = q.getfirst("levelName", "")
completionTime = q.getfirst("completionTime", "")
trinkets = q.getfirst("trinkets", 0)
player = verify_id() 


print "Content-type: text/html"
print

if (levelName != "" and completionTime != ""):
    levels = Level.selectBy(name = levelName)
    if levels.count() > 0:
        level = levels[0]
        score = Score(level = level,
                      player = player,
                      completionTime = int(completionTime),
                      trinkets = int(trinkets),
                      achievedOn = datetime.datetime.now())
        print "Saved score %d for %s on %s." % (int(completionTime), player.name, level.name)
    else:
        print "No such level as %s" % levelName

else:
    print "Required info not provided."

