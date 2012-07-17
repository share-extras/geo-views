<div id="${args.htmlid}-configDialog">
   <div class="hd">${msg("label.header")}</div>
   <div class="bd">
      <p style="padding: 1em;">${msg("msg.fields")}</p>
      <form id="${args.htmlid}-form" action="" method="POST">
         <div class="yui-gd">
            <div class="yui-u first">${msg("label.center")}:</div>
            <div class="yui-u" >
               <span id="${args.htmlid}-center"></span>
            </div>
         </div>
         <div class="yui-gd">
            <div class="yui-u first">${msg("label.zoom")}:</div>
            <div class="yui-u">
               <span id="${args.htmlid}-zoom"></span>
            </div>
         </div>
         <div class="yui-gd">
            <div class="yui-u first">${msg("label.mapType")}:</div>
            <div class="yui-u">
               <span id="${args.htmlid}-mapType"></span>
            </div>
         </div>
         <div class="yui-gd">
            <div class="yui-u first"><label for="${args.htmlid}-saveUserChanges">${msg("label.saveUserChanges")}:</label></div>
            <div class="yui-u">
               <input type="checkbox" name="saveUserChangesChecked" id="${args.htmlid}-saveUserChangesChecked" value="true" checked="checked" />
            </div>
         </div>
         <div class="bdft">
            <input type="submit" id="${args.htmlid}-ok" value="${msg("button.ok")}" />
            <input type="button" id="${args.htmlid}-cancel" value="${msg("button.cancel")}" />
         </div>
         <input type="hidden" name="lat" id="${args.htmlid}-fieldLat" />
         <input type="hidden" name="lng" id="${args.htmlid}-fieldLng" />
         <input type="hidden" name="zoom" id="${args.htmlid}-fieldZoom" />
         <input type="hidden" name="mapType" id="${args.htmlid}-fieldMapType" />
         <input type="hidden" name="saveUserChanges" id="${args.htmlid}-saveUserChanges" />
      </form>
   </div>
</div>