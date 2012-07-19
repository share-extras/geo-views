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
   var PREF_BASE = "org.sharextras.siteGeotaggedContent",
      PREF_ZOOM = ".zoom",
      PREF_CENTER = ".center",
      PREF_TYPE_ID = ".mapTypeId";


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
          * A unique ID for this map, persisted in dashlet config and so preserved if the dashlet is moved
          *
          * @property mapId
          * @type String
          * @default ""
          */
         mapId: "",

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
         mapTypeId: null,

         /**
          * Whether the user should be allowed to make changes to zoom, center etc.
          * 
          * @property allowUserChanges
          * @type boolean
          * @default true
          */
         allowUserChanges: true,

         /**
          * Whether user changes to zoom, center etc. should be persisted to user preferences
          * 
          * @property saveUserChanges
          * @type boolean
          * @default true
          */
         saveUserChanges: true,

         /**
          * Is the user a manager of the dashboard, i.e. should they be able to make changes?
          * 
          * @property isManager
          * @type boolean
          * @default false
          */
         isManager: false
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
         
         // Generate the unique map ID, if it does not already exist. This is required to persist personal map settings, since the component ID might change
         if (!this.options.mapId)
         {
            var mapId = this._randomString(16);
            Alfresco.util.Ajax.jsonPost({
               url: Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId),
               dataObj: {
                  mapId: mapId
               },
               successCallback: {
                  fn: function() {
                     this.options.mapId = mapId;
                  },
                  scope: this
               },
               failureMessage: this.msg("error.saveMapId")
            });
         }
         else
         {
            // Load zoom level, etc. if allowed and browser supports it
            if (this._browserSupportsHtml5Storage() && this.options.saveUserChanges)
            {
               this._loadMapConfig();
            }
         }
         
         // initialize google map
         this.refreshMap();
      },
      
      /**
       * Generate a random identifier
       * 
       * @method _randomString()
       * @param length {int} length of string to generate
       * @returns {String} The random string
       * @private
       */
      _randomString: function SiteGeotaggedContent__randomString(length)
      {
         var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
         var str = '';
         for (var i = 0; i < length; i++)
         {
             str += chars[Math.floor(Math.random() * chars.length)];
         }
         return str;
      },
      
      /**
       * Load map parameters from browser storage
       * 
       * @method _loadMapConfig
       */
      _loadMapConfig: function SiteGeotaggedContent__loadMapConfig()
      {
         this.options.zoom = parseInt(window.localStorage[this._getLocalStorageKey(PREF_ZOOM)] || this.options.zoom);
         this.options.mapTypeId = window.localStorage[this._getLocalStorageKey(PREF_TYPE_ID)] || this.options.mapTypeId;
         if (window.localStorage[this._getLocalStorageKey(PREF_CENTER)])
         {
            var center = Alfresco.util.parseJSON(window.localStorage[this._getLocalStorageKey(PREF_CENTER)]);
            if (center != null && typeof center == "object" && center.latitude && center.longitude)
            {
               this.options.center = center;
            }
         }
      },
      
      /**
       * Return the local storage key to be used for the specified value name
       * @method _getLocalStorageKey
       * @private
       * @param key {String} local name of the parameter key
       * @returns {String} Qualified key name suitable for use with browser storage
       */
      _getLocalStorageKey: function SiteGeotaggedContent__getLocalStorageKey(key)
      {
         return PREF_BASE + ".map." + this.options.mapId + "_" + Alfresco.constants.USERNAME + key;
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
         this.map = new google.maps.Map(this.mapContainer, this.getMapOptions({
            center: myLatlng,
         }));

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
       * Get all available Google Maps config options
       * 
       * @method getMapOptions
       * @param opts {object} additional values to add or override
       * @returns {object} configuration as an object literal
       */
      getMapOptions: function SiteGeotaggedContent_getMapOptions(opts)
      {
         var changesAllowed = this.options.isManager || this.options.allowUserChanges,
            mapOptions = 
            {
               zoom: this.options.zoom > 0 ? this.options.zoom : 2,
               mapTypeId: this.options.mapTypeId != null ? this.options.mapTypeId : google.maps.MapTypeId.ROADMAP,
               zoomControl: changesAllowed,
               scaleControl: changesAllowed,
               panControl: changesAllowed,
               draggable: changesAllowed,
               disableDoubleClickZoom: !changesAllowed,
               mapTypeControl: changesAllowed,
               streetViewControl: changesAllowed
            };
         return YAHOO.lang.merge(mapOptions, (opts || {}));
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
            
            if (item.geolocation)
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
         Alfresco.util.PopupManager.displayMessage({
            text: this.msg("error.loading")
         });
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
            if (noPersist !== true && this.options.saveUserChanges)
            {
               if (this._browserSupportsHtml5Storage())
               {
                  if (this.options.mapId)
                  {
                     window.localStorage[this._getLocalStorageKey(PREF_ZOOM)] = zoom;
                  }
               }
               else
               {
                  this.services.preferences.set(PREF_BASE + PREF_ZOOM, zoom);
               }
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
         if (noPersist !== true && this.options.saveUserChanges)
         {
            var c = { latitude: center.lat() || center.latitude, longitude: center.lng() || center.longitude };
            if (this._browserSupportsHtml5Storage())
            {
               if (this.options.mapId)
               {
                  window.localStorage[this._getLocalStorageKey(PREF_CENTER)] = 
                     "{ \"latitude\": " + (center.lat() || center.latitude) + ", \"longitude\": " + (center.lng() || center.longitude) + " }";
               }
            }
            else
            {
               this.services.preferences.set(PREF_BASE + PREF_CENTER, c);
            }
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
         if (noPersist !== true && this.options.saveUserChanges)
         {
            if (this._browserSupportsHtml5Storage())
            {
               if (this.options.mapId)
               {
                  window.localStorage[this._getLocalStorageKey(PREF_TYPE_ID)] = this.options.mapTypeId;
               }
            }
            else
            {
               this.services.preferences.set(PREF_BASE + PREF_TYPE_ID, this.options.mapTypeId);
            }
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
      },
      
      /**
       * Check if the web browser supports local storage
       * 
       * @property _browserSupportsHtml5Storage
       * @returns {boolean} true if local storage is available, false otherwise
       */
      _browserSupportsHtml5Storage: function SiteGeotaggedContent__browserSupportsHtml5Storage()
      {
         try
         {
           return 'localStorage' in window && window['localStorage'] !== null;
         }
         catch (e)
         {
           return false;
         }
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */
      
      /**
       * Event handler for dashlet resizing finished
       * @method onEndResize
       * @param height {int} New height in pixels
       */
      onEndResize: function SiteGeotaggedContent_onEndResize(height)
      {
         google.maps.event.trigger(this.map, 'resize');
         this.setCenter.call(this, this.map.getCenter());
      },

      /**
       * Configuration click handler
       *
       * @method onConfigClick
       * @param e {object} HTML event
       */
      onConfigClick: function SiteGeotaggedContent_onConfigClick(e)
      {
         var actionUrl = Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId);
         
         Event.stopEvent(e);
         
         if (!this.configDialog)
         {
            this.configDialog = new Alfresco.module.SimpleDialog(this.id + "-configDialog").setOptions(
            {
               width: "30em",
               templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "extras/modules/dashlets/site-geotagged-content/config", 
               actionUrl: actionUrl,
               onSuccess:
               {
                  fn: function SiteGeotaggedContent_onConfigFeed_callback(response)
                  {
                     this.options.allowUserChanges = Dom.get(this.configDialog.id + "-allowUserChangesChecked").checked;
                     this.options.saveUserChanges = Dom.get(this.configDialog.id + "-saveUserChangesChecked").checked;
                     this.map.setOptions(this.getMapOptions());
                  },
                  scope: this
               },
               doSetupFormsValidation:
               {
                  fn: function SiteGeotaggedContent_doSetupForm_callback(form)
                  {
                     // Update text
                     Dom.get(this.configDialog.id + "-center").innerHTML = $html(this.map.getCenter().toString());
                     Dom.get(this.configDialog.id + "-zoom").innerHTML = $html(this.map.getZoom());
                     Dom.get(this.configDialog.id + "-mapType").innerHTML = $html(this.map.getMapTypeId());
                     // Update actual form fields
                     Dom.get(this.configDialog.id + "-fieldLat").value = this.map.getCenter().lat();
                     Dom.get(this.configDialog.id + "-fieldLng").value = this.map.getCenter().lng();
                     Dom.get(this.configDialog.id + "-fieldZoom").value = this.map.getZoom();
                     Dom.get(this.configDialog.id + "-fieldMapType").value = this.map.getMapTypeId();
                     Dom.get(this.configDialog.id + "-saveUserChangesChecked").checked = this.options.saveUserChanges;
                     Dom.get(this.configDialog.id + "-allowUserChangesChecked").checked = this.options.allowUserChanges;
                  },
                  scope: this
               },
               doBeforeFormSubmit:
               {
                  fn: function SiteGeotaggedContent_doBeforeFormSubmit()
                  {
                     // Ensure checkbox states get sent even if it is empty
                     Dom.get(this.configDialog.id + "-saveUserChanges").value = 
                        Dom.get(this.configDialog.id + "-saveUserChangesChecked").checked ? "true" : "false";
                     Dom.get(this.configDialog.id + "-allowUserChanges").value = 
                        Dom.get(this.configDialog.id + "-allowUserChangesChecked").checked ? "true" : "false";
                  },
                  scope: this
               }
            });
         }
         else
         {
            this.configDialog.setOptions(
            {
               actionUrl: actionUrl
            });
         }
         this.configDialog.show();
      }
   });
})();
