<#setting number_format="computer" />
<#macro exif properties property>
   <#if properties["exif:" + property]??>
               <tr><th><strong title="${msg("label.exif_${property}.description")}">${msg("label.exif_${property}.title")}</strong></th><td>${properties["exif:" + property]?string?html}</td></tr>
   </#if>
</#macro>
<#if documentDetailsJSON??>
   <#assign id = args.htmlid?html>
<script type="text/javascript">//<![CDATA[
   new Extras.component.OSMMap("${id}").setOptions(
   {
      documentDetails: ${documentDetailsJSON},
      mapType: "${config.script["osm-map"].mapType?js_string}",
      mapInitialZoom: "${config.script["osm-map"].mapInitialZoom?js_string}",
      leafletTileUrl: "${(config.script["osm-map"].leafletTileUrl!'')?js_string}",
      loadLocation: ${(config.script["osm-map"].loadLocation!true)?string}
   }).setMessages(${messages});
//]]></script>

<div id="${id}-location" class="location-info"></div>

<div class="osm-map">
   <div id="${id}-map" class="map"></div>
</div>

<div class="hidden">
   <div id="${id}-info">
   <div class="osm-map-popup">
      <div class="thumbnail"><a href="document-details?nodeRef=${document.nodeRef}"><img src="${url.context}/proxy/alfresco/api/node/${document.nodeRef?replace(":/", "")}/content/thumbnails/doclib?c=queue&amp;ph=true" /></a></div>
   <#if document.node.properties??>
      <#assign props = document.node.properties>
      <div class="exif">
         <table cellpadding="0" cellspacing="0" width="100%">
            <tbody>
            <#list ["dateTimeOriginal.relativeTime", "pixelXDimension", "pixelYDimension", "exposureTime", "fNumber", "flash", "focalLength",
               "isoSpeedRatings", "manufacturer", "model", "software", "orientation", "xResolution", "yResolution", "resolutionUnit"] as name>
               <@exif props name />
            </#list>
            </tbody>
         </table>
      </div>
   </#if>
   </div>
   </div>
</div>
</#if>