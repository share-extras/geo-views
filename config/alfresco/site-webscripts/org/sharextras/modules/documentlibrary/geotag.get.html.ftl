<#assign el=args.htmlid?html>
<div id="${el}-dialog" class="geotag-dialog">
   <div id="${el}-dialogTitle" class="hd">${msg("title")}</div>
   <div class="bd">
      <form id="${el}-form" action="" method="post">
         <div class="yui-gd">
            <div id="${el}-map" class="geotag-dialog-map"></div>
            <input type="hidden" id="${el}-lat" name="lat" value="" />
            <input type="hidden" id="${el}-lon"  name="lon" value="" />
         </div>
         <div class="bdft">
            <input type="button" id="${el}-ok" value="${msg("button.ok")}" tabindex="0" />
            <input type="button" id="${el}-cancel" value="${msg("button.cancel")}" tabindex="0" />
         </div>
      </form>
   </div>
</div>