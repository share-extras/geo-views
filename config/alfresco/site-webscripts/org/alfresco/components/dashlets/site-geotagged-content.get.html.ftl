<#macro formatNumber num><#if num?is_number>${num?c}<#elseif num?is_string>${num?replace(",", ".")?number?c}<#else>null</#if></#macro>
<script type="text/javascript">//<![CDATA[
   var dashlet = new Alfresco.dashlet.SiteGeotaggedContent("${args.htmlid}").setOptions(
   {
      "siteId": "${page.url.templateArgs.site!""}",
      "componentId": "${instance.object.id}",
      "zoom": ${preferences.zoom!2?number},
      "center": <#if preferences.center?exists>{
         "latitude": <#if preferences.center.latitude?exists><@formatNumber preferences.center.latitude /><#else>null</#if>,
         "longitude": <#if preferences.center.longitude?exists><@formatNumber preferences.center.longitude /><#else>null</#if>
      }<#else>null</#if>,
      "mapTypeId": <#if preferences.mapTypeId?exists>"${preferences.mapTypeId}"<#else>null</#if>
   }).setMessages(
      ${messages}
   );
   var resizer = new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
   // Add end resize event handler
   var timer = YAHOO.lang.later(1000, this, function(dashlet, resizer) {
      if (resizer.widgets.resizer)
      {
         resizer.widgets.resizer.on("endResize", function(eventTarget)
         {
            dashlet.onEndResize(eventTarget.height);
         }, dashlet, true);
         timer.cancel();
      }
   }, [dashlet, resizer], true);
//]]></script>

<div class="dashlet map-dashlet">
   <div class="title">${msg("header.geotaggedContent")}</div>
   <div class="body" <#if args.height??>style="height: ${args.height}px;"</#if>>
      <div id="${args.htmlid}-map" class="map-canvas"></div>
   </div>
</div>
