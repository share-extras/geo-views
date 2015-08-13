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
   
   /*
    * Use a 4.2-style object to pass in info about the name of the client-side map widget and options.
    * 
    * Note that not all options are set here, since the Freemarker template has not yet been converted 
    * to the new style. This is in order to preserve compatibility with 4.0 and 4.1.
    */
   var mapWidget = {
      // Name of the JS component to use for the dashlet. Use to switch between Leaflet and GMaps.
      id: "SiteGeotaggedContent",
      name: "Extras.dashlet.GMapsSiteGeotaggedContent",
      //name: "Extras.dashlet.LeafletSiteGeotaggedContent",
      options: {
         // Use OSM by default for Leaflet tiles
         leafletTileUrl: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      }
   };
   
   model.widgets = [ mapWidget ];
}

main();