#!/usr/bin/python
from database_tables import UserCodeNugget

import simplejson

nuggets = UserCodeNugget.select()

print "Content-type: text/html"
print

json = { "monsters": [],
         "obstacles": [],
         "powerups": [] }

for nug in nuggets:
    url = "nugget.py?id=%s" % nug.id
    if nug.type == "monster":
        json["monsters"].append(url)
    if nug.type == "obstacle":
        json["obstacles"].append(url)
    if nug.type == "powerups":
        json["obstacles"].append(url)

print simplejson.dumps(json)

