Ext.require([
    'Ext.container.Viewport',
    'gxp.Viewer',
    'gxp.plugins.OLSource',
    'gxp.plugins.WMSSource'
]);

Ext.application({
    name: 'Viewer',
    launch: function() {
        Ext.create('gxp.Viewer', {
            sources: {
                ol: {
                    ptype: "gxp_olsource"
                },
                local: {
                    ptype: "gxp_wmssource",
                    url: "/geoserver/wms",
                    version: "1.1.1"
                }
            },
            map: {
                layers: [{
                    source: "ol",
                    type: "OpenLayers.Layer.WMS",
                    args: ["OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'}],
                    group: "background"
                }, {
                    source: "local",
                    name: "google:googleflutrends",
                    title: "Google flu trends",
                    queryable: true,
                    bbox: [-13884991.404203, 2870341.1822503, -7455066.2973878, 6338219.3590349],
                    selected: true
                }]
            }
        });
    }
});
