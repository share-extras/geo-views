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

            // Load maps API if not already loaded
            if (typeof google == "object" && typeof google.maps == "object")
            {
               this.initializeMap(this.options.documentDetails);
            }
            else
            {
               // Async load the Google Maps API. Need to do this, as it breaks the YUI Loader otherwise
               var script = document.createElement("script");
               script.type = "text/javascript";
               script.src = "http://maps.google.com/maps/api/js?sensor=false&callback=Extras.DocumentGeographicInfo.Callback";
               document.body.appendChild(script);
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
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            useStaticMap: false
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
         
         /* Decoupled event listener */
         YAHOO.Bubbling.on("metadataRefresh", this.doRefresh, this);
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
      },
      
      /**
       * Event handler called when the Google Maps API has loaded
       *
       * @method onGoogleAPIReady
       */
      onGoogleAPIReady: function DocumentGeographicInfo_onGoogleAPIReady()
      {
         this.initializeMap(this.options.documentDetails);
      }
      
   });
})();

Extras.DocumentGeographicInfo.Callback = function()
{
   var component = Alfresco.util.ComponentManager.findFirst("Extras.DocumentGeographicInfo");
   if (component)
   {
      component.onGoogleAPIReady();
   }
}