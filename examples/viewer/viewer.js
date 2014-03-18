Ext.require([
    'Ext.container.Viewport',
    'gxp.Viewer',
    'gxp.plugins.OLSource',
    'gxp.plugins.WMSSource',
    'gxp.plugins.WMSGetFeatureInfo',
    'gxp.plugins.RemoveLayer',
    'gxp.plugins.LayerTree',
    'gxp.plugins.ZoomToLayerExtent',
    'gxp.plugins.Navigation',
    'gxp.plugins.Zoom'
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
            }, {
                ptype: "gxp_removelayer",
                actionTarget: ["tree.tbar", "tree.contextMenu"]
            }, {
                ptype: "gxp_zoomtolayerextent",
                actionTarget: ["tree.contextMenu"]
            }, {
                ptype: "gxp_navigation",
                toggleGroup: "navigation"
            }, {
                ptype: "gxp_zoom",
                toggleGroup: "navigation",
                showZoomBoxAction: true,
                controlOptions: {zoomOnClick: false}
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
                    args: ["Blue marble", "http://maps.opengeo.org/geowebcache/service/wms", {layers: 'bluemarble'}],
                    group: "background"
                }, {
                    source: "ol",
                    type: "OpenLayers.Layer.WMS",
                    args: ["OpenStreetMap", "http://maps.opengeo.org/geowebcache/service/wms", {layers: 'openstreetmap', format: 'image/png'}],
                    group: "background"
                 }, {
                    source: "local",
                    name: "opengeo:ne_10m_admin_1_states_provinces",
                    title: "Countries",
                    bbox: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
                    queryable: true,
                    selected: true
                }]
            }
        });
    }
});
