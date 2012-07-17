<#macro formatNumber num><#if num?is_number>${num?c}<#elseif num?is_string>${num?replace(",", ".")?number?c}<#else>null</#if></#macro>
<#assign saveUserChanges=(args.saveUserChanges!'true')?string=='true' />
<script type="text/javascript">//<![CDATA[
   var dashlet = new Alfresco.dashlet.SiteGeotaggedContent("${args.htmlid}").setOptions(
   {
      "siteId": "${page.url.templateArgs.site!""}",
      "mapId": "${args.mapId!''}",
      "componentId": "${instance.object.id}",
      "zoom": <#if preferences.zoom?exists && saveUserChanges>${preferences.zoom?number?c}<#elseif args.zoom?exists>${args.zoom?number?c}<#else>2</#if>,
      "center": <#if preferences.center?exists && saveUserChanges>{
         "latitude": <#if preferences.center.latitude?exists><@formatNumber preferences.center.latitude /><#else>null</#if>,
         "longitude": <#if preferences.center.longitude?exists><@formatNumber preferences.center.longitude /><#else>null</#if>
      }<#elseif args.lat?exists && args.lng?exists>{
         "latitude": <@formatNumber args.lat />,
         "longitude": <@formatNumber args.lng />
      }<#else>null</#if>,
      "mapTypeId": <#if preferences.mapTypeId?exists && saveUserChanges>"${preferences.mapTypeId}"<#elseif args.mapType?exists>"${args.mapType}"<#else>null</#if>,
      "saveUserChanges": ${saveUserChanges?string}
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
