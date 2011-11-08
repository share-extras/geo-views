/**
 * Copyright (C) 2010-2011 Share Extras contributors.
 *
 */

/**
* Extras root namespace.
* 
* @namespace Extras
*/
if (typeof Extras == "undefined" || !Extras)
{
   var Extras = {};
}

/**
* Extras component namespace.
* 
* @namespace Extras
*/
if (typeof Extras.component == "undefined" || !Extras.component)
{
   Extras.component = {};
}

/**
 * Google Map component.
 *
 * @namespace Alfresco
 * @class Extras.component.OSMMap
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;

   /**
    * OSMMap constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Extras.component.OSMMap} The new OSMMap instance
    * @constructor
    */
   Extras.component.OSMMap = function(htmlId)
   {
      return Extras.component.OSMMap.superclass.constructor.call(this, "Extras.component.OSMMap", htmlId);
   };

   YAHOO.extend(Extras.component.OSMMap, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * JSON representation of document details
          *
          * @property documentDetails
          * @type object
          */
         documentDetails: null
      },

      /**
       * The data for the document
       * 
       * @property recordData
       * @type object
       */
      recordData: null,
      
      /**
       * Fired by YUI when parent element is available for scripting.
       * Initial History Manager event registration
       *
       * @method onReady
       */
      onReady: function OSMMap_onReady()
      {
         var h = Dom.getXY("alf-ft")[1] - Dom.getXY(this.id + "-map")[1] - 50;
         Dom.setStyle(this.id + "-map", "height", h + "px");

         // Asset data 
         this.recordData = this.options.documentDetails.item;
         this.recordData.jsNode = new Alfresco.util.Node(this.recordData.node);
         
         // Get node's geo location info
         var properties = this.recordData.node.properties;

         var map = new OpenLayers.Map(this.id + "-map", {
                 //controls:[
                 //    new OpenLayers.Control.PanZoomBar(),
                 //    new OpenLayers.Control.Attribution()
                 //],
                 projection: new OpenLayers.Projection("EPSG:900913"),
                 displayProjection: new OpenLayers.Projection("EPSG:4326")
             }),
             layer = new OpenLayers.Layer.OSM("OSM Map"),
             latlng = new OpenLayers.LonLat(properties["cm:longitude"], properties["cm:latitude"]),
             zoom = 15;
         
         map.addLayer(layer);
         map.addControl(new OpenLayers.Control.PanZoomBar());
         map.setCenter(latlng.transform(map.displayProjection, map.projection), zoom);
         
         // Pan the map before adding the marker
         map.pan(0, -100, {
             animate: false
         });
         
         // Add the marker
         var markers = new OpenLayers.Layer.Markers("Markers");
         map.addLayer(markers);
         
         autoSizeAnchoredBubble = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble, {
             'autoSize': true,
             'maxSize': new OpenLayers.Size(450, 450)
         });
         
         var feature = new OpenLayers.Feature(markers, latlng); 
         feature.closeBox = true;
         feature.popupClass = autoSizeAnchoredBubble;
         feature.data.popupContentHTML = Dom.get(this.id + "-info").innerHTML;
         feature.data.overflow = "auto";
         
         var marker = feature.createMarker();

         var markerClick = function (evt) {
             if (this.popup == null) {
                 this.popup = this.createPopup(this.closeBox);
                 map.addPopup(this.popup);
                 this.popup.show();
             } else {
                 this.popup.toggle();
             }
             currentPopup = this.popup;
             if (evt != null)
             {
                 OpenLayers.Event.stop(evt);
             }
         };
         marker.events.register("mousedown", feature, markerClick);
         markers.addMarker(marker);
         
         // Fake marker click
         markerClick.call(feature, null);
         
         // Use Ajax to load location info
         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.PROXY_URI.replace("/alfresco/", "/osm-nominatim/") + "reverse?format=json&lat=" + properties["cm:latitude"] + "&lon=" + properties["cm:longitude"] + "&zoom=12",
            successCallback:
            {
               fn: function OSMMap_Nominatim_SC(resp) {
                   if (typeof resp.json == "object")
                   {
                       Dom.get(this.id + "-location").innerHTML = this.msg("label.locationName", resp.json.display_name);
                   }
               },
               scope: this
            },
            failureCallback:
            {
               fn: this.onPollLoadFailed,
               scope: this
            },
            scope: this,
            noReloadOnAuthFailure: true
         });
      },

      /**
       * Event handler called when the OpenLayers API has loaded
       *
       * @method onOpenLayersAPIReady
       */
      onOpenLayersAPIReady: function OSMMap_onOpenLayersAPIReady()
      {
         // Get node's geo location info
         var properties = this.recordData.node.properties,
            latLong = new google.maps.LatLng(properties["cm:latitude"], properties["cm:longitude"]),
            mapOptions =
            {
               zoom: 16,
               center: latLong,
               mapTypeId: google.maps.MapTypeId.HYBRID
            };

         // Generate map centered on geo location
         var map = new google.maps.Map(Dom.get(this.id + "-map"), mapOptions),
            marker = new google.maps.Marker(
            {
               position: latLong,
               map: map,
               title: this.recordData.displayName
            });

         // Generate info window, showing EXIF panel if relevant
         var infoWindow = new google.maps.InfoWindow(
         {
            content: Dom.get(this.id + "-info")
         });
         google.maps.event.addListener(marker, "click", function()
         {
            infoWindow.open(map, marker);
         });

         if (this.recordData.jsNode.hasAspect("exif:exif"))
         {
            Dom.removeClass(this.id + "-exif", "hidden");

            // Pan the map a little to allow room for the EXIF data
            map.panBy(0, -200);
         }

         // Auto-open the info window
         infoWindow.open(map, marker);
      }
   });
})();