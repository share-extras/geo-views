<script type="text/javascript">//<![CDATA[
   new Alfresco.dashlet.SiteGeotaggedContent("${args.htmlid}").setOptions(
   {
      "siteId": "${page.url.templateArgs.site!""}",
      "componentId": "${instance.object.id}"
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
