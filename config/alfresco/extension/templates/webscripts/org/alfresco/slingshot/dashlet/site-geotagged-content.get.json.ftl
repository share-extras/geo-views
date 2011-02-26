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
            "latitude": ${item.properties.latitude!''},
            "longitude": ${item.properties.longitude!''}
         },
         "nodeType": "${item.typeShort}"
      }
      <#if item_has_next>,</#if>
   </#list>
   ]
}