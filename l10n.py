import simplejson

m_all_strings = False

def _loadStringDict():
    global m_all_strings
    # Localization - read srings.json only once
    string_file = open( "strings.json", "r")
    m_all_strings= simplejson.loads(string_file.read().decode("utf-8"))
    string_file.close()

def getStrings():
    global m_all_strings
    if m_all_strings == False:
        _loadStringDict()

    return m_all_strings["jp"]  # TODO get current language from settings

def makeLangSettings(selectedLang): 
    global m_all_strings
    if m_all_strings == False:
        _loadStringDict()

    settingsHtml = ""

    for key in m_all_strinngs.keys():
        dict = {"lang_code": key,
                "checked": "",
                "language": m_all_strings[selectedLang]["language_%s" % key]}
        if selectedLang == key:
            dict["checked"] = "checked=\"checked\""

        settingsHtml += render_template_file("lang-radio-button.html", dict)
    
    return settingsHtml
