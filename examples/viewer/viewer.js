Ext.require([
    'Ext.container.Viewport',
    'gxp.Viewer',
    'gxp.plugins.OLSource'
]);

Ext.application({
    name: 'Viewer',
    launch: function() {
        Ext.create('gxp.Viewer', {
            sources: {
                ol: {
                    ptype: "gxp_olsource"
                }
            },
            map: {
                layers: [{
                    source: "ol",
                    type: "OpenLayers.Layer.WMS",
                    args: ["OpenLayers WMS", "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'}],
                    group: "background"
                }]
            }
        });
    }
});
