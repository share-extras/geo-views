const PREFERENCES_ROOT = "org.alfresco.share.dashlet.siteGeotaggedContent";

function main()
{
   // Request the current user's preferences
   var result = remote.call("/api/people/" + stringUtils.urlEncode(user.name) + "/preferences?pf=" + PREFERENCES_ROOT);
   if (result.status == 200 && result != "{}")
   {
      var prefs = eval('(' + result + ')');
      try
      {
         // Populate the preferences object literal for easy look-up later
         preferences = eval('(prefs.' + PREFERENCES_ROOT + ')');
         if (typeof preferences != "object")
         {
            preferences = {};
         }
      }
      catch (e)
      {
      }
   }
   else
   {
      preferences = {};
   }

   model.preferences = preferences;
}

main();