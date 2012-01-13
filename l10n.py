import simplejson

m_all_strings = False

def getStrings():
    global m_all_strings
    if m_all_strings == False:
        # Localization - read srings.json only once
        string_file = open( "strings.json", "r")
        m_all_strings= simplejson.loads(string_file.read().decode("utf-8"))
        string_file.close()
    return m_all_strings["jp"]  # TODO get current language from settings

