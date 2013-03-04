<script type="text/javascript">//<![CDATA[
   new Alfresco.DocumentGeographicInfo("${args.htmlid}").setMessages(
      ${messages}
   );
//]]></script>

<div id="${args.htmlid}-body" class="document-geographic-info hidden">
   <div class="heading">${msg("heading")}</div>
   <div id="${args.htmlid}-map" class="document-geographic-map"></div>
</div>