Ext.require([
    'Ext.container.Viewport',
    'gxp.Viewer',
    'gxp.plugins.OLSource',
    'gxp.plugins.WMSSource',
    'gxp.plugins.WMSGetFeatureInfo',
    'gxp.plugins.LayerTree'
]);

Ext.application({
    name: 'Viewer',
    launch: function() {
        Ext.create('gxp.Viewer', {
            portalItems: ['mymap', {
                region: 'west',
                id: 'west',
                title: "Layers",
                layout: 'fit',
                split: true,
                width: 250
            }],
            tools: [{
                ptype: "gxp_wmsgetfeatureinfo",
                outputConfig: {
                    width: 400,
                    height: 200
                },
                toggleGroup: "layertools"
            }, {
                ptype: "gxp_layertree",
                outputConfig: {
                    id: "tree",
                    autoScroll: true,
                    border: true,
                    tbar: [] // we will add buttons to "tree.bbar" later
                },
                outputTarget: "west"
            }],
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
                id: 'mymap',
                region: 'center',
                title: "Map",
                projection: "EPSG:900913",
                units: "m",
                maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
                center: [-10764594.758211, 4523072.3184791],
                zoom: 3,
                controls: [
                    new OpenLayers.Control.Zoom(),
                    new OpenLayers.Control.Attribution(),
                    new OpenLayers.Control.Navigation()
                ],
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
