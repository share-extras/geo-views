/**
 * Copyright (C) 2005-2009 Alfresco Software Limited.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

 * As a special exception to the terms and conditions of version 2.0 of 
 * the GPL, you may redistribute this Program in connection with Free/Libre 
 * and Open Source Software ("FLOSS") applications as described in Alfresco's 
 * FLOSS exception.  You should have recieved a copy of the text describing 
 * the FLOSS exception, and it is also available here: 
 * http://www.alfresco.com/legal/licensing
 */
 
/**
 * Dashboard Geotagged Content component.
 * 
 * @namespace Alfresco
 * @class Alfresco.dashlet.SiteGeotaggedContent
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


   /**
    * Dashboard SiteGeotaggedContent constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.SiteGeotaggedContent} The new component instance
    * @constructor
    */
   Alfresco.dashlet.SiteGeotaggedContent = function SiteGeotaggedContent_constructor(htmlId)
   {
      return Alfresco.dashlet.SiteGeotaggedContent.superclass.constructor.call(this, "Alfresco.dashlet.SiteGeotaggedContent", htmlId);
   };

   /**
    * Extend from Alfresco.component.Base and add class implementation
    */
   YAHOO.extend(Alfresco.dashlet.SiteGeotaggedContent, Alfresco.component.Base,
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
          * The component id.
          *
          * @property componentId
          * @type string
          */
         componentId: "",

         /**
          * ID of the current site
          * 
          * @property siteId
          * @type string
          * @default ""
          */
         siteId: ""
      },

      /**
       * Map object
       * 
       * @property map
       * @type object
       * @default null
       */
      map: null,

      /**
       * Map container div object
       * 
       * @property mapContainer
       * @type object
       * @default null
       */
      mapContainer: null,

      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function SiteGeotaggedContent_onReady()
      {
         this.mapContainer = Dom.get(this.id + "-map");
         // initialize google map
         this.refreshMap();
      },
      
      /**
       * Refresh the contents of the map
       * @method refreshMap
       */
      refreshMap: function SiteGeotaggedContent_refreshMap()
      {
         this.initializeMap();
         this.refreshContent();
      },
      
      /**
       * Initialise the map itself
       * @method initializeMap
       */
      initializeMap: function SiteGeotaggedContent_initializeMap()
      {
         var myLatlng = new google.maps.LatLng(40.749444, -73.968056);
         var myOptions = 
         {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
         }
         this.map = new google.maps.Map(this.mapContainer, myOptions);
      },
      
      /**
       * Refresh content
       * @method refreshContent
       */
      refreshContent: function SiteGeotaggedContent_refreshContent()
      {
         var doclistUrl = Alfresco.constants.PROXY_URI + "slingshot/site/" + this.options.siteId + "/geotagged-content";
         
         // Make an AJAX request to the Tag Service REST API
         Alfresco.util.Ajax.jsonGet(
         {
            url: doclistUrl,
            successCallback:
            {
               fn: this.onDoclistSuccess,
               scope: this
            },
            failureCallback:
            {
               fn: this.onDoclistFailed,
               scope: this
            },
            scope: this,
            noReloadOnAuthFailure: true
         });
      },
      
      /**
       * Doclist items retrieved successfully
       * @method onDoclistSuccess
       * @param p_response {object} Response object from request
       */
      onDoclistSuccess: function SiteGeotaggedContent_onDoclistSuccess(p_response)
      {
         // Retrieve the docs list from the JSON response and trim to max number of items to display
         var maxItems = 50, 
            items = p_response.json.items.slice(0, maxItems),
            i,
            itemsLength = items.length,
            numGeoItems = 0,
            geoItemsTotalLat = 0,
            geoItemsTotalLng = 0,
            averageLat,
            averageLng;

         for (i = 0; i < itemsLength; i++)
         {
            var item = items[i];
            
            if (item.nodeType == "cm:content" && item.geolocation)
            {
               numGeoItems ++;
               geoItemsTotalLat += item.geolocation.latitude;
               geoItemsTotalLng += item.geolocation.longitude;
               this.createMarker(this.map, item);
            }
         }
         if (numGeoItems > 0)
         {
            averageLat = geoItemsTotalLat / numGeoItems;
            averageLng = geoItemsTotalLng / numGeoItems;
            this.map.setCenter(new google.maps.LatLng(averageLat, averageLng));
         }
      },
      
      /**
       * Doclist request failed
       * @method onDoclistFailed
       */
      onDoclistFailed: function SiteGeotaggedContent_onDoclistFailed()
      {
      },
      
      /**
       * Create a marker on the map to represent a content item
       * @method createMarker
       * @param map {object} Map object to add the item to
       * @param doc {object} Content item to add
       */
      createMarker: function SiteGeotaggedContent_createMarker(map, doc)
      {
         var latLng = new google.maps.LatLng(doc.geolocation.latitude, doc.geolocation.longitude);
         var marker = new google.maps.Marker(
         {
            position: latLng,
            map: map,
            title: doc.fileName
         });

         var uri = window.location.protocol + "//" + window.location.host +
            Alfresco.constants.URL_CONTEXT + "page/site/" + this.options.siteId +
            "/document-details?nodeRef=" + doc.nodeRef;

         google.maps.event.addListener(marker, 'click', function() {
             window.location = uri;
         });
      },

      /**
       * Poll results retrieved successfully
       * @method onResultsSuccess
       * @param p_response {object} Response object from request
       */
      onResultsSuccess: function SiteGeotaggedContent_onResultsSuccess(p_response)
      {
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */
      
      /**
       * Event handler for refresh button click
       * @method onRefresh
       * @param e {object} Event
       */
      onRefresh: function SiteGeotaggedContent_onRefresh(e)
      {
         if (e)
         {
            // Stop browser's default click behaviour for the link
            Event.preventDefault(e);
         }
         this.refreshMap();
      }
   });
})();
