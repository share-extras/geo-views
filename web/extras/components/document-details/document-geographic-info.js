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
      YAHOO.Bubbling.on("metadataRefresh", this.doRefresh, this);
      
      return this;
   };
   
   YAHOO.extend(Extras.DocumentGeographicInfo, Alfresco.component.Base,
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
           * Reference to the current document
           *
           * @property nodeRef
           * @type string
           * @default ""
           */
           nodeRef: "",

          /**
           * Current siteId, if any.
           * 
           * @property siteId
           * @type string
           * @default ""
           */
           siteId: "",
           
          /**
           * ContainerId representing root container
           *
           * @property containerId
           * @type string
           * @default "documentLibrary"
           */
          containerId: "documentLibrary",
          
          /**
           * JSON representation of document details
           *
           * @property documentDetails
           * @type object
           * @default null
           */
          documentDetails: null
      },
       
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
       * Event handler called when "onReady"
       *
       * @method: onReady
       */
      onReady: function DocumentGeographicInfo_onReady(layer, args)
      {
         var docData = this.options.documentDetails;
         this.mapContainer = Dom.get(this.id + "-map");

         if (typeof(docData.item) === "object" &&
               typeof(docData.item.node) === "object" &&
               typeof(docData.item.node.properties) === "object" &&
               typeof(docData.item.node.properties["cm:latitude"]) !== "undefined")
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
      initializeMap: function DocumentGeographicInfo_initializeMap(doc)
      {
         var latLng = new google.maps.LatLng(
                 doc.item.node.properties["cm:latitude"], 
                 doc.item.node.properties["cm:longitude"]);
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
            title: this.msg("tooltip.gmaps", doc.item.fileName)
         });
         google.maps.event.addListener(this.marker, 'click', function() {
            document.location.href = document.location.href.replace("/document-details", "/geographic-map");
         });
      },
      
      /**
      * Refresh component in response to metadataRefresh event
      *
      * @method doRefresh
      */
      doRefresh: function DocumentGeographicInfo_doRefresh()
      {
          YAHOO.Bubbling.unsubscribe("metadataRefresh", this.doRefresh);
          this.refresh('extras/components/document-details/document-geographic-info?nodeRef={nodeRef}' + (this.options.siteId ? '&site={siteId}' : ''));
      }
      
   });
})();