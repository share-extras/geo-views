<#if documentDetailsJSON??>
    <#assign el=args.htmlid?js_string>
    <script type="text/javascript">//<![CDATA[
        new Extras.DocumentGeographicInfo("${args.htmlid}").setOptions({
            nodeRef: "${nodeRef?js_string}",
            siteId: <#if site??>"${site?js_string}"<#else>null</#if>,
            containerId: "${container?js_string}",
            documentDetails: ${documentDetailsJSON}
        }).setMessages(
            ${messages}
        );
    //]]></script>
    
    <div id="${el}-body" class="document-geographic-info document-details-panel hidden">
        <h2 id="${el}-heading" class="thin dark">
            ${msg("heading")}
        </h2>
        <div id="${el}-map" class="document-geographic-map">
        </div>
    </div>

    <script type="text/javascript">//<![CDATA[
        Alfresco.util.createTwister("${el}-heading", "org_sharextras_DocumentGeographicInfo");
    //]]></script>
</#if>