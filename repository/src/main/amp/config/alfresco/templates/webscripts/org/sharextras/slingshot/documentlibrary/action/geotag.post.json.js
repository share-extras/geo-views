<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/documentlibrary/action/action.lib.js">

/**
 * Geotag files action
 * @method POST
 */

/**
 * Entrypoint required by action.lib.js
 *
 * @method runAction
 * @param p_params {object} Object literal containing files array
 * @return {object|null} object representation of action results
 */
function runAction(p_params)
{
   var result,
      assetNode = p_params.destNode,
      lat = json.get("lat"), lon = json.get("lon");
   
   // Must have lat and lon values
   if (lat == null || lon == null)
   {
      status.setCode(status.STATUS_BAD_REQUEST, "Missing latitude or longitude values");
      return;
   }

   // Must have a single file
   if (!assetNode)
   {
      status.setCode(status.STATUS_BAD_REQUEST, "No file");
      return;
   }

   try
   {
      result =
      {
         nodeRef: assetNode.nodeRef,
         action: "geotag",
         success: false
      }
      result.id = assetNode.name;
      result.type = assetNode.isContainer ? "folder" : "document";
      
      // Add the geographic aspect and set lat/lon props
      if (!assetNode.hasAspect("cm:geographic"))
      {
         assetNode.addAspect("cm:geographic")
      }
      assetNode.properties.latitude = lat;
      assetNode.properties.longitude = lon;
      assetNode.save();
      
      result.success = true;
   }
   catch (e)
   {
      result.success = false;
   }

   return [result];
}

/* Bootstrap action script */
main();
