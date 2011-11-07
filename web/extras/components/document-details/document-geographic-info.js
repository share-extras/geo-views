/**
 * Copyright (C) 2010-2011 Share Extras contributors.
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
 * Document geographic info component.
 * 
 * @namespace Extras
 * @class Extras.DocumentGeographicInfo
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
    * DocumentGeographicInfo constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Extras.DocumentGeographicInfo} The new DocumentGeographicInfo instance
    * @constructor
    */
   Extras.DocumentGeographicInfo = function(htmlId)
   {
      Extras.DocumentGeographicInfo.superclass.constructor.call(this, "Extras.DocumentGeographicInfo", htmlId);
      
      /* Decoupled event listeners */
      YAHOO.Bubbling.on("documentDetailsAvailable", this.onDocumentDetailsAvailable, this);
      
      return this;
   };
   
   YAHOO.extend(Extras.DocumentGeographicInfo, Alfresco.component.Base,
   {
      /**
       * GMap object
       */
      map: null,
      
      /**
       * GMap marker
       */
      marker: null,
      
      /**
       * Map container div
       */
      mapContainer: null,
      
      /**
       * Event handler called when the "documentDetailsAvailable" event is received
       *
       * @method: onDocumentDetailsAvailable
       */
      onDocumentDetailsAvailable: function DocumentGeographicInfo_onDocumentDetailsAvailable(layer, args)
      {
         var docData = args[1].documentDetails;
         this.mapContainer = Dom.get(this.id + "-map");

         if (typeof(docData.geolocation) === "object" &&
               typeof(docData.geolocation.latitude) !== "undefined")
         {
            Dom.removeClass(this.id + "-body", "hidden");
            
            if (this.map == null)
            {
               this.initializeMap(docData);
            }
            else
            {
               this.updateMap(docData);
            }
         }
         else
         {
            Dom.addClass(this.id + "-body", "hidden");
         }
      },
   
      /**
       * Initialise the map itself
       * @method initializeMap
       */
      initializeMap: function SiteGeotaggedContent_initializeMap(doc)
      {
         var latLng = new google.maps.LatLng(doc.geolocation.latitude, doc.geolocation.longitude);
         var myOptions = 
         {
            zoom: 10,
            center: latLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
         }
         this.map = new google.maps.Map(this.mapContainer, myOptions);
         this.marker = new google.maps.Marker(
         {
            position: latLng,
            map: this.map,
            title: doc.fileName
         });
      },
   
      /**
       * Update the map view
       * @method updateMap
       */
      updateMap: function SiteGeotaggedContent_updateMap(doc)
      {
         // First clear any existing marker
         if (this.marker != null)
         {
            this.marker.setMap(null);
            this.marker = null;
         }
         // Then re-center the map
         var latLng = new google.maps.LatLng(doc.geolocation.latitude, doc.geolocation.longitude);
         this.map.panTo(latLng);
         // Then add the new marker to the map
         this.marker = new google.maps.Marker(
         {
            position: latLng,
            map: this.map,
            title: doc.fileName
         });
      }
   });
})();