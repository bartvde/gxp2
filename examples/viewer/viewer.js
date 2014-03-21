Ext.require([
    'Ext.container.Viewport',
    'GeoExt.slider.Tip',
    'GeoExt.slider.Zoom',
    'gxp.Viewer',
    'gxp.plugins.OLSource',
    'gxp.plugins.WMSSource',
    'gxp.plugins.WMSGetFeatureInfo',
    'gxp.plugins.RemoveLayer',
    'gxp.plugins.LayerTree',
    'gxp.plugins.ZoomToExtent',
    'gxp.plugins.ZoomToLayerExtent',
    'gxp.plugins.Navigation',
    'gxp.plugins.NavigationHistory',
    'gxp.plugins.Zoom',
    'gxp.plugins.Measure',
    'gxp.panel.ScaleOverlay'
]);

Ext.application({
    name: 'Viewer',
    launch: function() {
        Ext.create('gxp.Viewer', {
            portalItems: [{region: 'center', layout: 'border', tbar: {id: 'paneltbar'}, items: ['mymap', {
                region: 'west',
                id: 'west',
                title: "Layers",
                layout: 'fit',
                split: true,
                width: 250
            }]}],
            tools: [{
                ptype: "gxp_wmsgetfeatureinfo",
                showButtonText: true,
                outputConfig: {
                    width: 400,
                    height: 200
                },
                toggleGroup: "interaction",
                actionTarget: 'paneltbar'
            }, {
                ptype: "gxp_measure", toggleGroup: "interaction",
                controlOptions: {immediate: true},
                showButtonText: true,
                actionTarget: "paneltbar"
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
            }, {
                ptype: "gxp_navigationhistory"
            }, {
                ptype: "gxp_zoomtoextent"
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
                }],
                items: [{
                    xtype: "gxp_scaleoverlay"
                }, {
                    xtype: "gx_zoomslider",
                    vertical: true,
                    height: 100,
                    maxHeight: 100,
                    plugins: Ext.create('GeoExt.slider.Tip', {
                        getText: function(thumb) {
                             return Ext.String.format( 
                                 '<div>Zoom Level: {0}</div><div>Scale: 1:{1}</div>',
                                 thumb.slider.getZoom(),
                                 thumb.slider.getScale()
                             );
                        }
                    })
                }]
            }
        });
    }
});
