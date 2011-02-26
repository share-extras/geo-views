function main()
{
   var siteId = url.templateArgs.siteId;
   
   if (siteId === null || siteId.length === 0)
   {
      status.setCode(status.STATUS_BAD_REQUEST, "No site was specified");
      return;
   }
   
   var site = siteService.getSite(siteId);
   
   if (site === null)
   {
      status.setCode(status.STATUS_NOT_FOUND, "Site not found: '" + siteId + "'");
      return;
   }
   
   model.siteId = siteId;
   model.items = search.query(
      {
         query: "PATH:\"" + site.node.qnamePath + "//*\" AND ASPECT:\"{http://www.alfresco.org/model/content/1.0}geographic\"",
         language: "fts-alfresco",
         page: {
            maxItems: 100,
            skipCount: 0
         }
      }
   );
}
main();