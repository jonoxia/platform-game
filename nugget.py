#!/usr/bin/python
from database_tables import UserCodeNugget

import cgi
import cgitb

cgitb.enable()
q = cgi.FieldStorage()
nuggetId = q.getfirst("id", "")

nugget = None
if nuggetId != "":
  nugget = UserCodeNugget.get(int(nuggetId))

print "Content-type: text/javascript"
print
if nugget != None:
    print nugget.code
else:
    print "No nugget here"
