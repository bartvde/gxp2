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
    'gxp.plugins.AddLayers',
    'gxp.plugins.MapQuestSource',
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
                ptype: "gxp_addlayers",
                actionTarget: "tree.tbar",
                outputTarget: "tree"/*,
                uploadSource: "local",
                postUploadAction: {
                    plugin: "styler"
                },
                catalogSourceKey: "local",
                search: {
                    selectedSource: "csw"
                }*/
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
                },
                mapquest: {
                    ptype: "gxp_mapquestsource"
                }
            },
            map: {
                id: 'mymap',
                region: 'center',
                title: "Map",
                projection: "EPSG:102113",
                center: [0, 0],
                zoom: 2,
                layers: [{
                    source: "mapquest",
                    title: "MapQuest OpenStreetMap",
                    name: "osm",
                    group: "background"
                }, {
                    source: "ol",
                    group: "background",
                    fixed: true,
                    type: "OpenLayers.Layer",
                    args: [
                        "None", {visibility: false}
                    ]
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
