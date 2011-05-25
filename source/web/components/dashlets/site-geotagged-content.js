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
    * Preferences
    */
   var PREFERENCES_DASHLET = "org.alfresco.share.dashlet",
      PREF_ZOOM = PREFERENCES_DASHLET + ".siteGeotaggedContent.zoom",
      PREF_CENTER = PREFERENCES_DASHLET + ".siteGeotaggedContent.center",
      PREF_TYPE_ID = PREFERENCES_DASHLET + ".siteGeotaggedContent.mapTypeId";


   /**
    * Dashboard SiteGeotaggedContent constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.SiteGeotaggedContent} The new component instance
    * @constructor
    */
   Alfresco.dashlet.SiteGeotaggedContent = function SiteGeotaggedContent_constructor(htmlId)
   {
      this.markers = Array();
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
         siteId: "",

         /**
          * Map zoom level
          * 
          * @property zoom
          * @type int
          * @default 2
          */
         zoom: 2,

         /**
          * Map center point. Properties latitude and longitude give the coordinates.
          * 
          * @property center
          * @type object
          * @default null
          */
         center: null,

         /**
          * Map type ID
          * 
          * @property mapTypeId
          * @type string
          * @default null
          */
         mapTypeId: null
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
       * Marker objects
       * 
       * @property markers
       * @type Array
       * @default null
       */
      markers: null,

      /**
       * Map container div object
       * 
       * @property mapContainer
       * @type HTMLElement
       * @default null
       */
      mapContainer: null,
      
      /**
       * Selected marker object
       * 
       * @property selectedMarker
       * @type google.maps.Marker
       * @default null
       */
      selectedMarker: null,

      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function SiteGeotaggedContent_onReady()
      {
         this.mapContainer = Dom.get(this.id + "-map");

         // Preferences service
         this.services.preferences = new Alfresco.service.Preferences();
         
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
      },
      
      /**
       * Initialise the map itself
       * @method initializeMap
       */
      initializeMap: function SiteGeotaggedContent_initializeMap()
      {
         var me = this;
         var myLatlng = this.options.center ? 
               new google.maps.LatLng(this.options.center.latitude, this.options.center.longitude) : 
                  new google.maps.LatLng(0, 0);
         var myOptions = 
         {
            zoom: this.options.zoom > 0 ? this.options.zoom : 2,
            center: myLatlng,
            mapTypeId: this.options.mapTypeId != null ? this.options.mapTypeId : google.maps.MapTypeId.ROADMAP
         }
         this.map = new google.maps.Map(this.mapContainer, myOptions);

         // Update map settings as user preferences
         // TODO: Persist settings as dashlet-specific prefs, not just user-specific
         google.maps.event.addListener(this.map, "zoom_changed", function() {
            me.setZoom.call(me, me.map.getZoom());
            me.setCenter.call(me, me.map.getCenter());
            me.refreshContent.call(me);
         });
         google.maps.event.addListener(this.map, "dragend", function() {
            me.setCenter.call(me, me.map.getCenter());
         });
         google.maps.event.addListener(this.map, "maptypeid_changed", function() {
            me.setTypeId.call(me, me.map.getMapTypeId());
         });
         
         // Reload markers when boundaries change
         google.maps.event.addListener(this.map, "bounds_changed", function() {
            me.refreshContent.call(me, null);
         });
      },
      
      /**
       * Refresh content
       * @method refreshContent
       */
      refreshContent: function SiteGeotaggedContent_refreshContent()
      {
         var doclistUrl = Alfresco.constants.PROXY_URI + "slingshot/site/" + this.options.siteId + "/geotagged-content",
            bounds = (this.map !== null) ? this.map.getBounds() : null;
         
         // Make an AJAX request to the Tag Service REST API
         Alfresco.util.Ajax.jsonGet(
         {
            url: doclistUrl,
            dataObj: {
               bb: (bounds !== null) ? bounds.toUrlValue() : ""
            },
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
         var me = this;
         
         // Retrieve the docs list from the JSON response and trim to max number of items to display
         var maxItems = 100, 
            items = p_response.json.items.slice(0, maxItems),
            i,
            markers = [],
            ex = null;
         
         var documentInList = function(doc, list)
         {
            var li;
            for (var j = 0, jj = list.length; j < jj; j++)
            {
               li = list[j];
               if ((li != null && typeof(li.doc) == "object" && li.doc.nodeRef == doc.nodeRef) ||
                     (typeof(li.nodeRef) == "string" && li.nodeRef == doc.nodeRef))
               {
                  return li;
               }
            }
            return null;
         }
         
         var isSameMarker = function(m1, m2)
         {
            return m1 != null && m2 != null && m1.getPosition().equals(m1.getPosition());
         }

         // Remove existing markers if they are not in the new list (unless they have an info window)
         for (i = 0; i < this.markers.length; i++)
         {
            if (this.markers[i].marker !== null)
            {
               ex = documentInList(this.markers[i].doc, items);
               if (ex === null && !isSameMarker(this.markers[i].marker, this.selectedMarker))
               {
                  this.markers[i].marker.setMap(null);
               }
               else
               {
                  markers.push(this.markers[i]);
               }
            }
         }

         // Add any new items that are not yet displayed
         for (i = 0; i < items.length; i++)
         {
            var item = items[i];
            
            if (item.nodeType == "cm:content" && item.geolocation)
            {
               ex = documentInList(item, this.markers);
               if (ex === null)
               {
                  markers.push(this.createMarker(this.map, item));
               }
               else
               {
                  markers.push(ex);
               }
            }
         }
         
         this.markers = markers;
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
         var me = this;
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
         
         var imgsrc = window.location.protocol + "//" + window.location.host +
            Alfresco.constants.URL_CONTEXT + "proxy/alfresco/api/node/" + 
            doc.nodeRef.replace("://", "/") + "/content/thumbnails/doclib?c=queue&ph=true"
         
         var ahtml = "";
         ahtml += "<div class=\"infobox-thumbnail\"><img src=\"" + imgsrc + "\" /></div>";
         ahtml += "<div class=\"infobox-details\">";
         ahtml += "<div class=\"infobox-name\"><a href=\"" + uri + "\" class=\"theme-color-1\">" + doc.fileName + "</a></div>";
         ahtml += "<div class=\"infobox-desc\">" + doc.description + "</div>";
         ahtml += "</div>";
         
         var infowindow = new google.maps.InfoWindow({
            content: ahtml,
            size: new google.maps.Size(50,50)
         });
         google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
            me.selectedMarker = marker;
         });
         
         return { marker : marker, doc: doc };

      },

      /**
       * Saves map zoom to user preferences
       * 
       * @method setZoom
       * @param zoom {int} New zoom to set
       * @param noPersist {boolean} [Optional] If set, preferences are not updated
       */
      setZoom: function SiteGeotaggedContent_setZoom(zoom, noPersist)
      {
         if (this.options.zoom != zoom)
         {
            this.options.zoom = zoom;
            if (noPersist !== true)
            {
               this.services.preferences.set(PREF_ZOOM, zoom);
            }
         }
      },

      /**
       * Saves map center point to user preferences
       * 
       * @method setCenter
       * @param center {object} New center to set with coordinates given by latitude and longitude properties
       * @param noPersist {boolean} [Optional] If set, preferences are not updated
       */
      setCenter: function SiteGeotaggedContent_setCenter(center, noPersist)
      {
         this.options.center = center;
         if (noPersist !== true)
         {
            this.services.preferences.set(PREF_CENTER, { latitude: center.lat(), longitude: center.lng() });
         }
      },

      /**
       * Saves map type ID to user preferences
       * 
       * @method setTypeId
       * @param id {string} Type of map to set up
       * @param noPersist {boolean} [Optional] If set, preferences are not updated
       */
      setTypeId: function SiteGeotaggedContent_setTypeId(id, noPersist)
      {
         this.options.mapTypeId = id;
         if (noPersist !== true)
         {
            this.services.preferences.set(PREF_TYPE_ID, this.options.mapTypeId);
         }
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
