<@markup id="customDocLibView" target="documentListContainer" action="after">
   <div id="${args.htmlid}-geo" class="alf-geo documents"></div>
   <div id="${args.htmlid}-geo-empty" class="hidden">
      <div class="yui-dt-liner"></div>
   </div>
   <div id="${args.htmlid}-geo-item-template" class="alf-geo-item hidden">
      <div class="alf-geo-item-thumbnail">
         <div class="alf-header">
            <div class="alf-select"></div>
               <a href="javascript:void(0)" class="alf-show-detail">&nbsp;</a>
         </div>
         <div class="alf-label"></div>
      </div>
      <div class="alf-detail">
              <div class="bd alf-detail">
                  <div class="alf-detail-thumbnail"></div>
                  <div class="alf-status"></div>
                  <div class="alf-actions"></div>
                  <div style="clear: both;"></div>
                      <div class="alf-description"></div>
          </div>
      </div>
   </div>
    <script type="text/javascript">//<![CDATA[
        YAHOO.Bubbling.subscribe("postSetupViewRenderers", function(layer, args) {
            var scope = args[1].scope;
            var geoViewRenderer = new Extras.DocumentListGeoViewRenderer("geo")
            geoViewRenderer.zoomLevel = ${preferences.zoomLevel!15};
            geoViewRenderer.center = "${(preferences.center!'')?js_string}";
            geoViewRenderer.mapTypeId = "${(preferences.mapTypeId!'')?js_string}";
            scope.registerViewRenderer(geoViewRenderer);
        });
    //]]></script>
</@>