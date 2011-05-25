<#macro formatNumber num><#if num?is_number>${num?c}<#elseif num?is_string>${num?replace(",", ".")?number?c}<#else>null</#if></#macro>
<#escape x as jsonUtils.encodeJSONString(x)>
{
   "itemCount": ${items?size},
   "items": [
   <#list items as item>
      {
         "nodeRef": "${item.nodeRef}",
         "fileName": "${item.name}",
         "title": "${item.properties.title!''}",
         "description": "${item.properties.description!''}",
         "geolocation":
         {
            "latitude": <#if item.properties.latitude?exists><@formatNumber item.properties.latitude /><#else>null</#if>,
            "longitude": <#if item.properties.longitude?exists><@formatNumber item.properties.longitude /><#else>null</#if>
         },
         "nodeType": "${item.typeShort}"
      }
      <#if item_has_next>,</#if>
   </#list>
   ]
}
</#escape>