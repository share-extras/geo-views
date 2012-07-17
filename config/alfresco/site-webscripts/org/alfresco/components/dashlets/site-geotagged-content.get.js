const PREFERENCES_ROOT = "org.alfresco.share.dashlet.siteGeotaggedContent";

function main()
{
   var s = new XML(config.script);
   
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
   
   // Call the repository to see if the user is site manager or not
   var userIsSiteManager = false,
       json = remote.call("/api/sites/" + page.url.templateArgs.site + "/memberships/" + encodeURIComponent(user.name));
   
   if (json.status == 200)
   {
      var obj = eval('(' + json + ')');
      if (obj)
      {
         userIsSiteManager = (obj.role == "SiteManager");
      }
   }
   model.userIsSiteManager = userIsSiteManager;

   model.preferences = preferences;
   
   var defaultCenter = s.defaults.center.toString().split(",");
   model.defaultCenter = [parseFloat(defaultCenter[0]), parseFloat(defaultCenter[1])];
   model.defaultZoom = parseInt(s.defaults.zoom.toString());
   model.defaultType = s.defaults.mapType.toString();
}

main();