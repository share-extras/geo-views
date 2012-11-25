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
      this.rowClassName = "alf-detail";
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
      },
      
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
      //Extras.DocumentListGeoViewRenderer.superclass.superclass.setupRenderer.call(this, scope);
      Alfresco.DocumentListGalleryViewRenderer.superclass.setupRenderer.call(this, scope);
      
      this.documentList = scope;
      
      var container = Dom.get(scope.id + this.parentElementIdSuffix);
      
      var viewRendererInstance = this;
      
      Event.delegate(container, 'mouseover', function DL_GVR_onGalleryItemMouseOver(event, matchedEl, container)
      {
         Dom.addClass(matchedEl, 'alf-hover');
         viewRendererInstance.onEventHighlightRow(scope, event, matchedEl);
      }, 'div.' + this.rowClassName, this);
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

         // set up the map
         var map = new L.Map(mapId).setView([center[0], center[1]], this.zoomLevel);
         
         // create the tile layer with correct attribution
         L.tileLayer(this.options.leafletTileUrl, {
            attribution: scope.msg("label.copyright.osm")
         }).addTo(map);
         
         // save map position and zoom levels
         // when zooming leaflet fires both events, which leads to an exception being thrown from the repo
         // therefore we must first check that the other event is not 'in progress' before attempting the save
         
         function savePrefs() {
            if (this.savingPrefs == false)
            {
               this.savingPrefs = true;
               var latlng = map.getCenter();
               Alfresco.logger.debug("Set " + PREFERENCES_DOCLIST + " to " + map.getZoom());
               scope.services.preferences.set(PREFERENCES_DOCLIST, { zoomLevel: map.getZoom(), center: latlng.lat + "," + latlng.lng }, {
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
         };
         
         map.on('zoomend', function(e) {
            savePrefs.call(this);
         }, this);
         
         map.on('moveend', function(e) {
            savePrefs.call(this);
         }, this);

         this.map = map;
      }
      
      for (var i = 0; i < this.markers.length; i++)
      {
         this.map.removeLayer(this.markers[i]);
      }
      
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
         
         //var galleryItemThumbnailDiv = this.getRowItemThumbnailElement(galleryItem);
         //var galleryItemHeaderDiv = this.getRowItemHeaderElement(galleryItem);
         var galleryItemDetailDiv = this.getRowItemDetailElement(galleryItem);
         var galleryItemActionsDiv = this.getRowItemActionsElement(galleryItem);
         
         // Set the item header id
         //galleryItemHeaderDiv.setAttribute('id', scope.id + '-item-header-' + oRecord.getId());
         
         // Suffix of the content actions div id must match the onEventHighlightRow target id
         galleryItemActionsDiv.setAttribute('id', scope.id + '-actions-' + galleryItemId);

         // Details div ID
         galleryItemDetailDiv.setAttribute('id', scope.id + '-details-' + galleryItemId);
         
         // Render the thumbnail within the gallery item
         /*
         this.renderCellThumbnail(
               scope,
               galleryItemThumbnailDiv, 
               oRecord, 
               galleryItem, 
               null,
               '');*/
         
         // Add the drag and drop
         /*
         var imgId = record.jsNode.nodeRef.nodeRef;
         var dnd = new Alfresco.DnD(imgId, scope);
         */
         
         // Create a YUI Panel with a relative context of its associated galleryItem
         /*
         galleryItemDetailDiv.panel = new YAHOO.widget.Panel(galleryItemDetailDiv,
         { 
            visible:false, draggable:false, close:false, constraintoviewport: true, 
            underlay: 'none', width: DETAIL_PANEL_WIDTH,
            context: [galleryItem, 'tl', 'tl', [this.galleryColumnsChangedEvent], DETAIL_PANEL_OFFSET]
         });
         */

         var properties = record.jsNode.properties;

         Alfresco.logger.debug(oRecord.getId());
         // create a marker in the given location and add it to the map
         if (properties["cm:latitude"] && properties["cm:longitude"])
         {
            var marker = L.marker([properties["cm:latitude"], properties["cm:longitude"]], {
               title: record.displayName
            }).addTo(this.map);
            marker.bindPopup(Dom.get(scope.id + '-details-' + galleryItemId), { width: 400, maxWidth: 400 });
            Alfresco.logger.debug("Has geo data");
            this.markers.push(marker);
            /*
            marker.on("click", function(e) {
               if (Dom.get(scope.id + '-details-' + this.galleryItemId))
               {
                  Dom.get(scope.id + '-popup-' + this.galleryItemId).appendChild(Dom.get(scope.id + '-details-' + this.galleryItemId));
                  Dom.setStyle(Dom.get(scope.id + '-popup-' + this.galleryItemId).parentNode, "width", "");
               }
            }, { galleryItemId: galleryItemId });
            //.bindPopup(name).openPopup();
            //var marker = new L.Marker(latlng);
            
            */
         }
      };
      
      /*
      scope.widgets.dataTable.subscribe("renderEvent", function DL_renderEvent()
      {
         Alfresco.logger.debug("DataTable renderEvent");
      }, scope, true);*/
   };
   
   // TODO Need renderCellSelected()?
   
   /*
   Extras.DocumentListGeoViewRenderer.prototype.renderCellThumbnail = function DL_GVR_renderCellThumbnail(scope, elCell, oRecord, oColumn, oData, imgIdSuffix)
   {
      var record = oRecord.getData(),
      node = record.jsNode,
      properties = node.properties,
      name = record.displayName,
      isContainer = node.isContainer,
      isLink = node.isLink,
      extn = name.substring(name.lastIndexOf(".")),
      imgId = node.nodeRef.nodeRef; // DD added
      
      // Do something with the node

      // create a marker in the given location and add it to the map
      if (properties["cm:latitude"] && properties["cm:longitude"])
      {
         var marker = L.marker([properties["cm:latitude"], properties["cm:longitude"]]).addTo(this.map);
         marker.bindPopup(name);
         this.markers.push(marker);
         //.bindPopup(name).openPopup();
         //var marker = new L.Marker(latlng);
      }
   };
   */

})();