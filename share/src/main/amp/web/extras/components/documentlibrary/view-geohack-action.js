/**
 * Document library Geotag action
 * 
 * @namespace Alfresco
 * @class Alfresco.doclib.Actions
 */
(function()
{
   /**
    * Show the document geo location on geohack.
    *
    * @method onActionViewGeohack
    * @param asset {object} Object literal representing one file or folder to be actioned
    */
   YAHOO.Bubbling.fire("registerAction",
   {
      actionName: "onActionViewGeohack",
      fn: function DL_onActionViewGeohack(asset)
      {
          var lat = "", lon = "";
          
          if (typeof(asset.node) === "object" &&
                  typeof(asset.node.properties) === "object" &&
                  typeof(asset.node.properties["cm:latitude"]) !== "undefined" &&
                  typeof(asset.node.properties["cm:longitude"]) !== "undefined")
          {
              lat = asset.node.properties["cm:latitude"];
              lon = asset.node.properties["cm:longitude"];
              window.open("http://toolserver.org/~geohack/geohack.php?params=" + lat + "_N_" + lon + "_E", "_blank");
          }
          else
          {
              Alfresco.util.PopupManager.displayMessage({
                  text: Alfresco.util.message("message.view-geohack.missing-data")
              });
          }
      }
   });
})();
