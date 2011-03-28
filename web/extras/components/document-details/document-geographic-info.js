/**
 * Document geographic info component.
 * 
 * @namespace Alfresco
 * @class Alfresco.DocumentGeographicInfo
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
    * @return {Alfresco.DocumentGeographicInfo} The new DocumentGeographicInfo instance
    * @constructor
    */
   Alfresco.DocumentGeographicInfo = function(htmlId)
   {
      Alfresco.DocumentGeographicInfo.superclass.constructor.call(this, "Alfresco.DocumentGeographicInfo", htmlId);
      
      /* Decoupled event listeners */
      YAHOO.Bubbling.on("documentDetailsAvailable", this.onDocumentDetailsAvailable, this);
      
      return this;
   };
   
   YAHOO.extend(Alfresco.DocumentGeographicInfo, Alfresco.component.Base,
   {
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
            this.initializeMap(docData);
            Dom.removeClass(this.id + "-body", "hidden");
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
         var map = new google.maps.Map(this.mapContainer, myOptions);
         var marker = new google.maps.Marker(
         {
            position: latLng,
            map: map,
            title: doc.fileName
         });
      }
   });
})();