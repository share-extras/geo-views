/*
 * Copyright (C) 2010-2012 Share Extras contributors
 *
 * This file is part of the Share Extras project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
 * @module DocumentLibrary
 */

/**
 * Geographic view extension of DocumentListViewRenderer component.
 *
 * @namespace Extras
 * @class Extras.DocumentListGeoViewRenderer
 * @extends Alfresco.DocumentListViewRenderer
 * @author Will Abson
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       Anim = YAHOO.util.Anim;
   
   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML;
   
   /**
    * Preferences
    */
   var PREFERENCES_DOCLIST = "org.alfresco.share.documentList",
      PREF_ZOOMLEVEL = PREFERENCES_DOCLIST + ".zoomLevel",
      PREF_CENTER = PREFERENCES_DOCLIST + ".center";
   
   /**
    * GeoViewRenderer constructor.
    *
    * @param name {String} The name of the GeoViewRenderer
    * @return {Extras.DocumentListGeoViewRenderer} The new GeoViewRenderer instance
    * @constructor
    */
   Extras.DocumentListGeoViewRenderer = function(name)
   {
      Extras.DocumentListGeoViewRenderer.superclass.constructor.call(this, name);
      this.parentElementIdSuffix = "-geo";
      this.parentElementEmptytIdSuffix = "-geo-empty";
      this.rowClassName = "alf-geo-item";
      // Defaults to large but we'll copy the metadata from detailed view
      this.metadataBannerViewName = "detailed";
      this.metadataLineViewName = "detailed";
      this.thumbnailColumnWidth = 200;
      
      var me = this;
      
      YAHOO.Bubbling.on("gmapsScriptLoaded", function onGmapsScriptLoaded() {
         me.scriptLoaded = true;
         if (this.renderedView == true)
         {
            me.renderView.call(me, me.scope);
         }
      });
      
      return this;
   };
   
   /**
    * Extend from Alfresco.DocumentListViewRenderer
    */
   YAHOO.extend(Extras.DocumentListGeoViewRenderer, Alfresco.DocumentListGalleryViewRenderer,
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
          * URL with parameters for fetching map tiles
          * 
          * @property leafletTileUrl
          * @type string
          * @default "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          */
         leafletTileUrl: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      },
      
      /**
       * Default map zoom
       * 
       * @property zoomLevel
       * @type int
       * @default 15
       */
      zoomLevel: 15,
      
      /**
       * Default map center
       * 
       * @property center
       * @type string
       * @default ""
       */
      center: "",
      
      map: null,
      
      mapDiv: null,
      
      markers: [],
      
      savingPrefs: false,
      
      /**
       * Performs any teardown or visual changes to deselect this view in the interface
       *
       * @method destroyView
       * @param scope {object} The DocumentList object
       * @param sRequest {string} Original request
       * @param oResponse {object} Response object
       * @param oPayload {MIXED} (optional) Additional argument(s)
       */
      destroyView: function DL_GVR_destroyView(scope, sRequest, oResponse, oPayload)
      {
         YAHOO.util.Dom.setStyle(scope.id + this.parentElementIdSuffix, 'display', 'none');
         YAHOO.util.Dom.setStyle(this.mapDiv, 'display', 'none');
         Dom.removeClass(scope.id + this.parentElementIdSuffix, "documents-geo");
      }
      
   });
   
   /**
    * Generates a row item HTML ID from the given dataTable record
    *
    * @method getRowItemId
    * @param oRecord {object} data table record
    * @return {string} the row HTML item ID
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemId = function DL_GVR_getRowItemId(oRecord)
   {
      if (this.documentList != null && oRecord != null)
      {
         return this.documentList.id + '-geo-item-' + oRecord.getId();
      }
   };
   
   /**
    * Gets the row item HTML element from the given dataTable record, checking and fixing any IDs changed by AJAX calls
    * to the dataTable as well
    *
    * @method getRowItem
    * @param oRecord {object} data table record
    * @param elCell {HTMLElement} the data table cell asking for the gallery item (optional)
    * @return {HTMLElement} the row item
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItem = function DL_GVR_getRowItem(oRecord, elCell)
   {
      if (this.documentList != null && oRecord != null)
      {
         var galleryItemId = this.getRowItemId(oRecord);
         // Yahoo.util.Dom.get does not work here for some reason
         var galleryItem = document.getElementById(galleryItemId);
         if (galleryItem === null && elCell != null)
         {
            // AJAX call must have updated the table, change our ID as well
            var rowElement = Dom.getAncestorByTagName(elCell, 'tr');
            var oldGalleryItemId = this.documentList.id + '-geo-item-' + rowElement.id;
            galleryItem = document.getElementById(oldGalleryItemId);
            if (galleryItem !== null)
            {
               galleryItem.setAttribute('id', galleryItemId);
            }
         }
         return galleryItem;
      }
   };
   
   /**
    * Generates a row item select id from the given dataTable record
    *
    * @method getRowItemSelectId
    * @param oRecord {object} data table record
    * @return {string} the row item select control ID
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemSelectId = function DL_GVR_getRowItemSelectId(oRecord)
   {
      if (oRecord != null)
      {
         return 'checkbox-' + oRecord.getId() + '-geo-item';
      }
   };
   
   // Override some of the standard ViewRenderer methods
   
   Extras.DocumentListGeoViewRenderer.prototype.setupRenderer = function DL_GVR_setupRenderer(scope)
   {
      Alfresco.DocumentListGalleryViewRenderer.superclass.setupRenderer.call(this, scope);
      
      this.documentList = scope;
      
      var container = Dom.get(scope.id + this.parentElementIdSuffix);
      
      var viewRendererInstance = this;
      
      Event.delegate(container, 'mouseover', function DL_GVR_onGalleryItemMouseOver(event, matchedEl, container)
      {
         Dom.addClass(matchedEl, 'alf-hover');
         viewRendererInstance.onEventHighlightRow(scope, event, matchedEl);
      }, 'div.' + this.rowClassName, this);
      
      // Async load the Google Maps API. Need to do this, as it breaks the YUI Loader otherwise
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = window.location.protocol + "//maps.google.com/maps/api/js?sensor=false&callback=Extras.DocumentListGeoViewRenderer.onGMapsScriptLoad";
      document.body.appendChild(script);
   };
   
   /**
    * Render the view using the given scope (documentList), request and response.
    *
    * @method renderView
    * @param scope {object} The DocumentList object
    * @param sRequest {string} Original request
    * @param oResponse {object} Response object
    * @param oPayload {MIXED} (optional) Additional argument(s)
    */
   Extras.DocumentListGeoViewRenderer.prototype.renderView = function DL_GVR_renderView(scope, sRequest, oResponse, oPayload)
   {
      this.renderedView = true;
      this.scope = scope;
      if (this.scriptLoaded == true)
      {
         YAHOO.util.Dom.setStyle(scope.id + this.parentElementIdSuffix, 'display', '');
         Dom.addClass(scope.id + this.parentElementIdSuffix, "documents-geo");
         
         var mapId = scope.id + this.parentElementIdSuffix + "-map", 
               mapDiv = Dom.get(mapId);
         
         var container = Dom.get(scope.id + this.parentElementIdSuffix);
         var oRecordSet = scope.widgets.dataTable.getRecordSet();
         
         scope.widgets.dataTable.onDataReturnInitializeTable.call(scope.widgets.dataTable, sRequest, oResponse, oPayload);
         
         if (!this.mapDiv)
         {
            mapDiv = document.createElement("div");
            Dom.setAttribute(mapDiv, "id", mapId);
            Dom.addClass(mapDiv, "map");
            Dom.setStyle(mapDiv, "height", "" + ((window.innerHeight || document.documentElement.offsetHeight || document.body.offsetHeight) - 310) + "px");
            Dom.get(scope.id + this.parentElementIdSuffix).appendChild(mapDiv);
            this.mapDiv = mapDiv;
         }
         else
         {
            YAHOO.util.Dom.setStyle(this.mapDiv, 'display', '');
         }
         
         if (!this.map)
         {
            var center = (this.center || "").split(",");
            if (center.length == 1)
            {
               center = [51, 0];
            }
            
            this._renderMap(scope, mapId, {
               center: {
                  lat: center[0],
                  lng: center[1]
               }
            });
         }
         
         this._removeAllMarkers();
         
         var galleryItemTemplate = Dom.get(scope.id + '-geo-item-template'),
            galleryItem = null;
      
         var oRecord, record, i, j;
         for (i = 0, j = oRecordSet.getLength(); i < j; i++)
         {
            oRecord = oRecordSet.getRecord(i);
            record = oRecord.getData();
            
            // Append a gallery item div
            var galleryItemId = this.getRowItemId(oRecord);
            galleryItem = galleryItemTemplate.cloneNode(true);
            Dom.removeClass(galleryItem, 'hidden');
            galleryItem.setAttribute('id', galleryItemId);
            container.appendChild(galleryItem);
            
            var galleryItemDetailDiv = this.getRowItemDetailElement(galleryItem);
            var galleryItemActionsDiv = this.getRowItemActionsElement(galleryItem);
            
            // Suffix of the content actions div id must match the onEventHighlightRow target id
            galleryItemActionsDiv.setAttribute('id', scope.id + '-actions-' + galleryItemId);

            // Details div ID
            galleryItemDetailDiv.setAttribute('id', scope.id + '-details-' + galleryItemId);

            var properties = record.jsNode.properties;

            // create a marker in the given location and add it to the map
            if (properties["cm:latitude"] && properties["cm:longitude"])
            {
               this._addMarker({
                  lat: properties["cm:latitude"],
                  lng: properties["cm:longitude"],
                  title: record.displayName,
                  galleryItemDetailDivId: scope.id + '-details-' + galleryItemId
               });
            }
         };
      }
   };
   
   /**
    * Render the map instance into the map Dom element. Override this if you wish to use a different map implementation.
    * 
    * @method _renderMap
    * @param scope {object} The DocumentList object
    * @param {string} mapId   Dom ID of the element into which the map should be rendered
    * @param {object} pObj    Map parameters. Must define a property `center` with `lat` and `lng` values.
    * @private
    */
   Extras.DocumentListGeoViewRenderer.prototype._renderMap = function DL_GVR__renderMap(scope, mapId, pObj)
   {
      var me = this,
         center = pObj.center;
      var myLatlng = new google.maps.LatLng(center.lat, center.lng);
      this.map = new google.maps.Map(Dom.get(mapId), {
         center: myLatlng,
         zoom: this.zoomLevel,
         mapTypeId: this.mapTypeId != null ? this.mapTypeId : google.maps.MapTypeId.HYBRID
      });

      // Update map settings as user preferences
      google.maps.event.addListener(this.map, "zoom_changed", function() {
         me._saveMapPreferences.call(me, scope);
      });
      google.maps.event.addListener(this.map, "dragend", function() {
         me._saveMapPreferences.call(me, scope);
      });
      google.maps.event.addListener(this.map, "maptypeid_changed", function() {
         me._saveMapPreferences.call(me, scope);
      });
   }
   
   /**
    * Add a marker to the map. Override this if you wish to use a different map implementation.
    * 
    * @method _addMarker
    * @param {string} mapId   Dom ID of the element into which the map should be rendered
    * @param {object} mObj    Marker parameters. Must define properties `lat`, `lng`, `title` and `galleryItemDetailDivId`.
    * @private
    */
   Extras.DocumentListGeoViewRenderer.prototype._addMarker = function DL_GVR__addMarker(mObj)
   {
      var me = this, map = this.map;
      var latLng = new google.maps.LatLng(mObj.lat, mObj.lng);
      var marker = new google.maps.Marker(
      {
         position: latLng,
         map: map,
         title: mObj.title
      });
      this.markers.push(marker);
      
      var infowindow = new google.maps.InfoWindow({
         content: Dom.get(mObj.galleryItemDetailDivId),
         size: new google.maps.Size(50,50)
      });
      google.maps.event.addListener(marker, 'click', function() {
         infowindow.open(map, marker);
         me.selectedMarker = marker;
      });
   }
   
   /**
    * Remove all markers from the map. Override this if you wish to use a different map implementation.
    * 
    * @method _removeAllMarkers
    * @private
    */
   Extras.DocumentListGeoViewRenderer.prototype._removeAllMarkers = function DL_GVR__removeAllMarkers()
   {
      for (var i = 0; i < this.markers.length; i++)
      {
         this.markers[i].setMap(null);
      }
   }
   
   /**
    * Save map settings using the preferences service. Override this if you wish to use a different map implementation.
    * 
    * @method _saveMapPreferences
    * @param scope {object} The DocumentList object
    * @private
    */
   Extras.DocumentListGeoViewRenderer.prototype._saveMapPreferences = function DL_GVR__saveMapPreferences(scope)
   {
      this._savePreferenceValues(scope, {
         zoom: this.map.getZoom(), 
         center: {
            lat: this.map.getCenter().lat(), 
            lng: this.map.getCenter().lng()
         },
         mapTypeId: this.map.getMapTypeId()
      });
   }
   
   /**
    * Save preference values
    * 
    * @method _savePreferenceValues
    * @param scope {object} The DocumentList object
    * @param {object} pObj Setting values. Must define properties `center` and `zoom`, can define others.
    * @private
    */
   Extras.DocumentListGeoViewRenderer.prototype._savePreferenceValues = function DL_GVR__savePreferenceValues(scope, pObj)
   {
      if (this.savingPrefs == false)
      {
         this.savingPrefs = true;
         var prefValues = {};
         for (var k in pObj)
         {
            if (k == "center")
            {
               prefValues["center"] = "" + pObj.center.lat + "," + pObj.center.lng;
            }
            else if (k == "zoom")
            {
               prefValues["zoomLevel"] = pObj.zoom;
            }
            else
            {
               prefValues[k] = pObj[k];
            }
         }
         Alfresco.logger.debug("Set " + PREFERENCES_DOCLIST + " to " + pObj.zoom);
         scope.services.preferences.set(PREFERENCES_DOCLIST, prefValues, {
            successCallback: {
               fn: function() {
                  this.savingPrefs = false;
               },
               scope: this
            },
            failureCallback: {
               fn: function() {
                  this.savingPrefs = false;
               },
               scope: this
            }
         });
      }
   }
   
   Extras.DocumentListGeoViewRenderer.onGMapsScriptLoad = function DL_GVR_onGMapsScriptLoad(e)
   {
      YAHOO.Bubbling.fire("gmapsScriptLoaded");
   };
   
   Extras.DocumentListLeafletGeoViewRenderer = function DocumentListLeafletGeoViewRenderer_constructor(name)
   {
      Extras.DocumentListLeafletGeoViewRenderer.superclass.constructor.call(this, name);
   };
   
   YAHOO.extend(Extras.DocumentListLeafletGeoViewRenderer, Extras.DocumentListGeoViewRenderer,
   {
      _renderMap: function DL_LGVR__renderMap(scope, mapId, pObj)
      {
         // set up the map
         var center = pObj.center,
            map = new L.Map(mapId).setView([center.lat, center.lng], this.zoomLevel);
         
         // create the tile layer with correct attribution
         L.tileLayer(this.options.leafletTileUrl, {
            attribution: scope.msg("label.copyright.osm")
         }).addTo(map);
         
         map.on('zoomend', function(e) {
            this._saveMapPreferences.call(this, scope);
         }, this);
         
         map.on('moveend', function(e) {
            this._saveMapPreferences.call(this, scope);
         }, this);

         this.map = map;
      },
      
      _addMarker: function DL_LGVR__addMarker(mObj)
      {
         var marker = L.marker([mObj.lat, mObj.lng], {
            title: mObj.title
         }).addTo(this.map);
         marker.bindPopup(Dom.get(mObj.galleryItemDetailDivId), { width: 400, maxWidth: 400 });
         Alfresco.logger.debug("Binding popup to item ID " + mObj.galleryItemDetailDivId);
         this.markers.push(marker);
      },
      
      _removeAllMarkers: function DL_GVR__removeAllMarkers()
      {
         for (var i = 0; i < this.markers.length; i++)
         {
            this.map.removeLayer(this.markers[i]);
         }
      },
      
      _saveMapPreferences: function DL_LGVR__saveMapPreferences(scope)
      {
         // save map position and zoom levels
         // when zooming leaflet fires both events, which leads to an exception being thrown from the repo
         // therefore we must first check that the another event is not 'in progress' before attempting the save
         this._savePreferenceValues(scope, {
            zoom: this.map.getZoom(), 
            center: {
               lat: this.map.getCenter().lat, 
               lng: this.map.getCenter().lng
            }
         });
      }
   });

})();