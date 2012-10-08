/**
 * Copyright (C) 2010-2012 Share Extras contributors.
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
   YAHOO.extend(Extras.DocumentListGeoViewRenderer, Alfresco.DocumentListViewRenderer,
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
   
   /**
    * Gets the row item's detail popup panel element from the given row item
    *
    * @method getRowItemDetailElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item detail element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemDetailElement = function DL_GVR_getRowItemDetailElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemDetailElement = Dom.getChildren(rowItem)[1];
         // YUI may have added its container
         if (Dom.hasClass(galleryItemDetailElement, 'yui-panel-container'))
         {
            galleryItemDetailElement = Dom.getFirstChild(galleryItemDetailElement);
         }
         return galleryItemDetailElement;
      }
   };
   
   /**
    * Gets the row item's detail description element from the given row item
    *
    * @method getRowItemDetailDescriptionElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item detail description element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemDetailDescriptionElement = function DL_GVR_getRowItemDetailDescriptionElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemDetailDiv = this.getRowItemDetailElement(rowItem);
         return Dom.getChildren(Dom.getFirstChild(galleryItemDetailDiv))[3];
      }
   };
   
   /**
    * Gets the row item's detail thumbnail element from the given row item
    *
    * @method getRowItemDetailThumbnailElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item detail thumbnail element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemDetailThumbnailElement = function DL_GVR_getRowItemDetailThumbnailElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemDetailDiv = this.getRowItemDetailElement(rowItem);
         return Dom.getFirstChild(Dom.getFirstChild(galleryItemDetailDiv));
      }
   };
   
   /**
    * Gets the row item's thumbnail element from the given row item
    *
    * @method getRowItemThumbnailElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item thumbnail element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemThumbnailElement = function DL_GVR_getRowItemThumbnailElement(rowItem)
   {
      if (rowItem != null)
      {
         return Dom.getFirstChild(rowItem);
      }
   };
   
   /**
    * Gets the row item's header element from the given row item
    *
    * @method getRowItemHeaderElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item header element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemHeaderElement = function DL_GVR_getRowItemHeaderElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemThumbnailDiv = this.getRowItemThumbnailElement(rowItem);
         return Dom.getFirstChild(galleryItemThumbnailDiv);
      }
   };
   
   /**
    * Gets the row item's selection element from the given row item
    *
    * @method getRowItemSelectElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item selection element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemSelectElement = function DL_GVR_getRowItemSelectElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemHeaderElement = this.getRowItemHeaderElement(rowItem);
         return Dom.getFirstChild(galleryItemHeaderElement);
      }
   };
   
   /**
    * Gets the row item's label element from the given row item
    *
    * @method getRowItemLabelElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item label element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemLabelElement = function DL_GVR_getRowItemLabelElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemThumbnailDiv = this.getRowItemThumbnailElement(rowItem);
         return Dom.getChildren(galleryItemThumbnailDiv)[1];
      }
   };
   
   /**
    * Gets the row item's status element from the given row item
    *
    * @method getRowItemStatusElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item status element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemStatusElement = function DL_GVR_getRowItemStatusElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemDetailDiv = this.getRowItemDetailElement(rowItem);
         return Dom.getChildren(Dom.getFirstChild(galleryItemDetailDiv))[1];
      }
   };
   
   /**
    * Gets the row item's actions element from the given row item
    *
    * @method getRowItemActionsElement
    * @param rowItem {HTMLElement} The row item object
    * @return {HTMLElement} the row item actions element
    */
   Extras.DocumentListGeoViewRenderer.prototype.getRowItemActionsElement = function DL_GVR_getRowItemActionsElement(rowItem)
   {
      if (rowItem != null)
      {
         var galleryItemDetailDiv = this.getRowItemDetailElement(rowItem);
         return Dom.getChildren(Dom.getFirstChild(galleryItemDetailDiv))[2];
      }
   };
   
   // Override some of the standard ViewRenderer methods
   
   Extras.DocumentListGeoViewRenderer.prototype.getDataTableRecordIdFromRowElement = function DL_GVR_getDataTableRecordIdFromRowElement(scope, rowElement)
   {
      var elementId = Extras.DocumentListGeoViewRenderer.superclass.getDataTableRecordIdFromRowElement.call(this, scope, rowElement);
      if (elementId != null)
      {
         return elementId.replace(scope.id + '-gallery-item-', '');
      }
   };
   
   Extras.DocumentListGeoViewRenderer.prototype.getRowElementFromDataTableRecord = function DL_GVR_getRowElementFromDataTableRecord(scope, oRecord)
   {
      var galleryItemId = this.getRowItemId(oRecord);
      // Yahoo.util.Dom.get does not work here for some reason
      return document.getElementById(galleryItemId);
   };
   
   Extras.DocumentListGeoViewRenderer.prototype.getRowSelectElementFromDataTableRecord = function DL_GVR_getRowSelectElementFromDataTableRecord(scope, oRecord)
   {
      var selectId = this.getRowItemSelectId(oRecord);
      return Dom.get(selectId);
   };
   
   Extras.DocumentListGeoViewRenderer.prototype.setupRenderer = function DL_GVR_setupRenderer(scope)
   {
      Extras.DocumentListGeoViewRenderer.superclass.setupRenderer.call(this, scope);
      
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
         
         map.on('zoomend', function(e) {
            if (this.savingPrefs == false)
            {
               this.savingPrefs = true;
               var latlng = map.getCenter();
               Alfresco.logger.debug("Set " + PREF_ZOOMLEVEL + " to " + map.getZoom());
               scope.services.preferences.set(PREF_ZOOMLEVEL, "" + map.getZoom(), {
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
         }, this);
         
         map.on('moveend', function(e) {
            if (this.savingPrefs == false)
            {
               this.savingPrefs = true;
               var latlng = map.getCenter();
               Alfresco.logger.debug("Set " + PREF_CENTER + " to " + latlng.lat + "," + latlng.lng);
               scope.services.preferences.set(PREF_CENTER, latlng.lat + "," + latlng.lng, {
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
   
   Extras.DocumentListGeoViewRenderer.prototype.getThumbnail = function DL_GVR_getThumbnail(scope, elCell, oRecord, oColumn, oData, imgIdSuffix, renditionName)
   {
      if (imgIdSuffix == null)
      {
         imgIdSuffix = "-hidden";
      }
      if (renditionName == null)
      {
         renditionName = "imgpreview";
      }
      
      var record = oRecord.getData(),
         node = record.jsNode,
         properties = node.properties,
         name = record.displayName,
         isContainer = node.isContainer,
         isLink = node.isLink,
         extn = name.substring(name.lastIndexOf(".")),
         imgId = node.nodeRef.nodeRef + imgIdSuffix, // DD added
         imgHtml;
      
      if (isContainer)
      {
         imgHtml = '<img id="' + imgId + '" class="alf-gallery-item-thumbnail-img" src="' + Alfresco.constants.URL_RESCONTEXT + 'mediamanagement/components/documentlibrary/images/folder-256.png" />';
      }
      else
      {
         imgHtml = '<img id="' + imgId + '" class="alf-gallery-item-thumbnail-img" src="' + Alfresco.DocumentList.generateThumbnailUrl(record, renditionName) + '" alt="' + $html(extn) + '" title="' + $html(name) + '" />';
      }
      return { id: imgId, html: imgHtml, isContainer: isContainer, isLink: isLink };
   };
   
   /**
    * Render a thumbnail for a given oRecord
    */
   Extras.DocumentListGeoViewRenderer.prototype.renderCellThumbnail = function DL_GVR_renderCellThumbnail(scope, elCell, oRecord, oColumn, oData, imgIdSuffix, renditionName)
   {
      var containerTarget; // This will only get set if thumbnail represents a container
      
      var thumbnail = this.getThumbnail(scope, elCell, oRecord, oColumn, oData, imgIdSuffix, renditionName);

      // Just add the data table thumbnail once
      if (!document.getElementById(thumbnail.id))
      {
         if (thumbnail.isContainer)
         {
            elCell.innerHTML += '<span class="folder">' + (thumbnail.isLink ? '<span class="link"></span>' : '') + (scope.dragAndDropEnabled ? '<span class="droppable"></span>' : '') + thumbnail.html;
            containerTarget = new YAHOO.util.DDTarget(thumbnail.id); // Make the folder a target
         }
         else
         {
            elCell.innerHTML += (thumbnail.isLink ? '<span class="link"></span>' : '') + thumbnail.html;
         }
      }
   };
   
   Extras.DocumentListGeoViewRenderer.prototype.renderCellStatus = function DL_GVR_renderCellStatus(scope, elCell, oRecord, oColumn, oData)
   {
      Alfresco.DocumentListGalleryViewRenderer.superclass.renderCellStatus.call(this, scope, elCell, oRecord, oColumn, oData);
      var galleryItem = this.getRowItem(oRecord, elCell);
      // Check for null galleryItem due to ALF-15529
      if (galleryItem != null)
      {
         // Copy status
         var galleryItemStatusElement = this.getRowItemStatusElement(galleryItem).innerHTML = elCell.innerHTML;
         // Clear out the table cell so there's no conflicting HTML IDs
         elCell.innerHTML = '';
      }
   };
   
   Extras.DocumentListGeoViewRenderer.prototype.renderCellDescription = function DL_GVR_renderCellDescription(scope, elCell, oRecord, oColumn, oData)
   {
      Alfresco.DocumentListGalleryViewRenderer.superclass.renderCellDescription.call(this, scope, elCell, oRecord, oColumn, oData);
      var galleryItem = this.getRowItem(oRecord, elCell);
      // Check for null galleryItem due to ALF-15529
      if (galleryItem != null)
      {
         // Copy description
         var galleryItemDetailDescriptionElement = this.getRowItemDetailDescriptionElement(galleryItem).innerHTML = elCell.innerHTML;
         // Clear out the table cell so there's no conflicting HTML IDs
         elCell.innerHTML = '';
         // Add a simple display label
         this.getRowItemLabelElement(galleryItem).innerHTML = 
            Alfresco.DocumentList.generateFileFolderLinkMarkup(scope, oRecord.getData()) + $html(oRecord.getData().displayName) + '</a>';
         var galleryItemDetailThumbnailElement = this.getRowItemDetailThumbnailElement(galleryItem);
         // Only set panel thumbnail if it's currently empty
         if (galleryItemDetailThumbnailElement.innerHTML == '')
         {
            var thumbnail = this.getThumbnail(scope, elCell, oRecord, oColumn, oData, '-detail');
            this.getRowItemDetailThumbnailElement(galleryItem).innerHTML = thumbnail.html;
         }
      }
   };
   
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