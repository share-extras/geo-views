if (model.widgets)
{
    for (var i = 0; i < model.widgets.length; i++)
    {
        var widget = model.widgets[i];
        if (widget.id == "SiteGeotaggedContent")
        {
            widget.name = "Extras.dashlet.LeafletSiteGeotaggedContent";
        }
    }
}
