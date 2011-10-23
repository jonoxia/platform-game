#!/usr/bin/python

from sqlobject import *
import datetime
from platformer_config import DB_URL

connection = connectionForURI( DB_URL )
sqlhub.processConnection = connection

class Player(SQLObject):
    email = StringCol()
    name = StringCol()
    session = StringCol()
    avatarURL = StringCol()

class Level(SQLObject):
    name = StringCol()
    creator = ForeignKey("Player")
    modified = DateTimeCol()
    startX = IntCol()
    startY = IntCol()
    # More stuff like tileset URL

class LevelObject( SQLObject ):
    level = ForeignKey("Level")
    type = StringCol()
    x = IntCol()
    y = IntCol()
    width = IntCol()
    height = IntCol()

# Other tables:  Scores for level completion

if __name__ == "__main__":
    Player.createTable()
    Level.createTable()
    LevelObject.createTable()
