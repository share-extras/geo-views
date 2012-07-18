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
   
   var query = "PATH:\"" + site.node.qnamePath + "//*\" AND TYPE:\"{http://www.alfresco.org/model/content/1.0}content\" AND ASPECT:\"{http://www.alfresco.org/model/content/1.0}geographic\"";
   if (args.bb !== null && args.bb !== "")
   {
      var ba = args.bb.split(",");
      query += " AND cm:latitude:" + ba[0] + ".." + ba[2];
      query += " AND cm:longitude:" + ba[1] + ".." + ba[3];
   }
   
   model.siteId = siteId;
   model.items = search.query(
      {
         query: query,
         language: "fts-alfresco",
         page: {
            maxItems: 100,
            skipCount: 0
         }
      }
   );
}
main();