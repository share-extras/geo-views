function gmaps_init() {
    // Do nothing
}

/**
 * Document library Geotag action
 * 
 * @namespace Alfresco
 * @class Alfresco.doclib.Actions
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;

   // Async handler to bring in Google Maps scripts
   Event.onDOMReady(function geotag_gmapsInit() {
       var script = document.createElement("script");
       script.type = "text/javascript";
       script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=gmaps_init";
       document.body.appendChild(script);
   });
   
   /**
    * Geotag a document.
    *
    * @method onActionGeotag
    * @param asset {object} Object literal representing one file or folder to be actioned
    */
   YAHOO.Bubbling.fire("registerAction",
   {
      actionName: "onActionGeotag",
      fn: function DL_onActionGeotag(asset)
       {
          var nodeRef = asset.nodeRef,
             lat = "", lon = "",
             displayName = asset.displayName,
             actionUrl = Alfresco.constants.PROXY_URI + $combine("slingshot/doclib/action/geotag/node", nodeRef.replace(":/", ""));
          
          if (typeof(asset.node) === "object" &&
                typeof(asset.node.properties) === "object" &&
                typeof(asset.node.properties["cm:latitude"]) !== "undefined" &&
                typeof(asset.node.properties["cm:longitude"]) !== "undefined")
          {
             lat = asset.node.properties["cm:latitude"];
             lon = asset.node.properties["cm:longitude"];
          }
    
          // Validation
          var fnValidate = function fnValidate(field, args, event, form, silent, message)
          {
             return field.value !== "";
          };
    
          // Always create a new instance
          this.modules.geotag = new Alfresco.module.SimpleDialog(this.id + "-geotag").setOptions(
          {
             width: "50em",
             templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "extras/modules/documentlibrary/geotag",
             actionUrl: actionUrl,
             onSuccess:
             {
                fn: function dlA_onActionChangeType_success(response)
                {
                   YAHOO.Bubbling.fire("metadataRefresh",
                   {
                      highlightFile: displayName
                   });
                   Alfresco.util.PopupManager.displayMessage(
                   {
                      text: this.msg("message.geotag.success", displayName)
                   });
                },
                scope: this
             },
             onFailure:
             {
                fn: function dlA_onActionChangeType_failure(response)
                {
                   Alfresco.util.PopupManager.displayMessage(
                   {
                      text: this.msg("message.geotag.failure", displayName)
                   });
                },
                scope: this
             },
             doSetupFormsValidation:
             {
                fn: function dlA_onActionChangeType_doSetupFormsValidation(p_form)
                {
                   // Add validation
                   p_form.addValidation(this.id + "-geotag-lat", fnValidate, null, "change");
                   p_form.addValidation(this.id + "-geotag-lon", fnValidate, null, "change");
                   p_form.setShowSubmitStateDynamically(true, false);
                
                   var me = this, marker = null;
                   // Set up the GMap
                   var latLng = new google.maps.LatLng(lat !== "" ? lat : 0.0, lon !== "" ? lon : 0.0);
                   var myOptions = 
                   {
                      zoom: 1,
                      center: latLng,
                      mapTypeId: google.maps.MapTypeId.ROADMAP,
                      draggableCursor: "crosshair"
                   }
                   var map = new google.maps.Map(Dom.get(this.modules.geotag.id + "-map"), myOptions);
                   if (lat !== "" && lon !== "")
                   {
                      marker = new google.maps.Marker(
                      {
                         position: latLng,
                         map: map,
                         title: displayName
                      });
                      map.setZoom(10);
                   }
                   // Add click listener to the map to update coordinates
                   google.maps.event.addListener(map, "click", function(e) {
                      // Update the coordiates stored in the form
                      Dom.get(me.modules.geotag.id + "-lat").value = e.latLng.lat();
                      Dom.get(me.modules.geotag.id + "-lon").value = e.latLng.lng();
                      
                      // Trigger re-validation of the form
                      p_form.updateSubmitElements();
                      
                      // Remove the old marker if present
                      if (marker !== null)
                      {
                         marker.setMap(null)
                         marker = null;
                      }
                      
                      // Centre the map on the new coordinates and add a new marker
                      map.panTo(e.latLng);
                      marker = new google.maps.Marker(
                      {
                         position: e.latLng,
                         map: map,
                         title: displayName
                      });
                   });
                },
                scope: this
             }
          });
          this.modules.geotag.show();
       }
   });
})();
