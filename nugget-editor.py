#!/usr/bin/python
from database_tables import UserCodeNugget
from webserver_utils import *

import cgi
import cgitb
import datetime

cgitb.enable()
q = cgi.FieldStorage()
nuggetId = q.getfirst("id", "")

nugget = None
if nuggetId != "":
  nugget = UserCodeNugget.get(int(nuggetId))

code = q.getfirst("code-input", "")
name = q.getfirst("nugget-name", "")
type = q.getfirst("nugget-type", "")

if code != "":
    player = verify_id()
    if nugget == None:
        nugget = UserCodeNugget(name = name,
                                type = type,
                                code = code,
                                modified = datetime.datetime.now(),
                                creator = player)
    else:
        if player == nugget.creator:
            nugget.code = code
            nugget.name = name
            nugget.type = type

if nugget != None:
    values = {"nugget_id": nugget.id,
              "nugget_name": nugget.name,
              "nugget_type": nugget.type,
              "nugget_code": nugget.code}
else:
    values = {"nugget_id": "",
              "nugget_name": "",
              "nugget_type": "",
              "nugget_code": ""}


print "Content-type: text/html"
print
print render_template_file("nugget-editor.html", values)
