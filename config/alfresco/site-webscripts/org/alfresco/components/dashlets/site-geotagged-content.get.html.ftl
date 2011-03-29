<script type="text/javascript">//<![CDATA[
   new Alfresco.dashlet.SiteGeotaggedContent("${args.htmlid}").setOptions(
   {
      "siteId": "${page.url.templateArgs.site!""}",
      "componentId": "${instance.object.id}",
      "zoom": ${preferences.zoom!2?number},
      "center": <#if preferences.center?exists>{
         "latitude": <#if preferences.center.latitude?exists>${preferences.center.latitude?number}<#else>null</#if>,
         "longitude": <#if preferences.center.longitude?exists>${preferences.center.longitude?number}<#else>null</#if>
      }<#else>null</#if>,
      "mapTypeId": <#if preferences.mapTypeId?exists>"${preferences.mapTypeId}"<#else>null</#if>
   }).setMessages(
      ${messages}
   );
   new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
//]]></script>

<div class="dashlet map-dashlet">
   <div class="title">${msg("header.geotaggedContent")}</div>
   <div class="body" <#if args.height??>style="height: ${args.height}px;"</#if>>
      <div id="${args.htmlid}-map" class="map-canvas"></div>
   </div>
</div>
