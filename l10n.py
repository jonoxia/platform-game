
m_loc_strings =  False

def getStrings():
    if m_loc_strings == False:
        # Localization TODO read strings.json once
        string_file = open( "strings.json", "r")
        strings = simplejson.loads(string_file.read().decode("utf-8"))
        string_file.close()
        m_loc_strings = strings["jp"] # TODO get language from settings
    return m_loc_strings

