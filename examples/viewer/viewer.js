Ext.require([
    'Ext.container.Viewport',
    'GeoExt.slider.Tip',
    'GeoExt.slider.Zoom',
    'gxp.Viewer',
    'gxp.plugins.OLSource',
    'gxp.plugins.WMSSource',
    'gxp.plugins.WMSCSource',
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
    'gxp.plugins.BingSource',
    'gxp.plugins.GoogleSource',
    'gxp.plugins.OSMSource',
    'gxp.plugins.MapBoxSource',
    'gxp.plugins.FeatureManager',
    'gxp.plugins.QueryForm',
    'gxp.plugins.FeatureGrid',
    'gxp.plugins.LayerProperties',
    'gxp.panel.ScaleOverlay',
    'gxp.container.WMSStylesDialog',
    'gxp.tab.CrumbPanel'
]);

Ext.application({
    name: 'Viewer',
    launch: function() {
        window.app = Ext.create('gxp.Viewer', {
            portalItems: [{
                region: 'center',
                layout: 'border',
                tbar: {id: 'paneltbar'},
                items: ['mymap', {
                    region: 'west',
                    xtype: 'gxp_crumbpanel',
                    id: 'tree',
                    layout: 'fit',
                    split: true,
                    width: 250
                }, {
                    region: "south",
                    id: "south",
                    height: 220,
                    border: false,
                    split: true,
                    collapsible: true,
                    collapseMode: "mini",
                    collapsed: true,
                    hideCollapseTool: true,
                    header: false,
                    layout: "border",
                    items: [{
                        region: "center",
                        id: "table",
                        title: "Table",
                        layout: "fit"
                    }, {
                        region: "west",
                        width: 320,
                        id: "query",
                        title: "Query",
                        split: true,
                        collapsible: true,
                        collapseMode: "mini",
                        collapsed: true,
                        hideCollapseTool: true,
                        layout: "fit"
                    }]
                }]
            }],
            tools: [{
                ptype: "gxp_featuremanager",
                id: "querymanager",
                selectStyle: {cursor: ''},
                autoLoadFeatures: true,
                maxFeatures: 50,
                paging: true,
                pagingType: gxp.plugins.FeatureManager.WFS_PAGING
            }, {
                ptype: "gxp_featuregrid",
                featureManager: "querymanager",
                showTotalResults: true,
                autoLoadFeature: false,
                alwaysDisplayOnMap: true,
                controlOptions: {multiple: true},
                displayMode: "selected",
                outputTarget: "table",
                outputConfig: {
                    id: "featuregrid",
                    columnsSortable: false
                }
            }, {
                ptype: "gxp_wmsgetfeatureinfo",
                showButtonText: true,
                outputConfig: {
                    width: 400,
                    height: 200
                },
                toggleGroup: "interaction",
                actionTarget: 'paneltbar'
            }, {
                ptype: "gxp_queryform",
                showButtonText: true,
                featureManager: "querymanager",
                autoExpand: "query",
                actionTarget: "paneltbar",
                outputTarget: "query"
            }, {
                ptype: "gxp_measure", toggleGroup: "interaction",
                controlOptions: {immediate: true},
                showButtonText: true,
                actionTarget: "paneltbar"
            }, {
                ptype: "gxp_layertree",
                outputConfig: {
                    id: "layers",
                    title: "Layers",
                    autoScroll: true,
                    border: true,
                    tbar: [] // we will add buttons to "tree.bbar" later
                },
                outputTarget: "tree"
            }, {
                ptype: "gxp_addlayers",
                actionTarget: "layers.tbar",
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
                actionTarget: ["layers.tbar", "layers.contextMenu"]
            }, {
                ptype: "gxp_layerproperties",
                id: "layerproperties",
                outputConfig: {defaults: {autoScroll: true}, width: 320},
                actionTarget: ["layers.tbar", "layers.contextMenu"],
                outputTarget: "tree"
            }, {
                ptype: "gxp_zoomtolayerextent",
                actionTarget: ["layers.contextMenu"]
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
                    ptype: "gxp_wmscsource",
                    url: "/geoserver/wms",
                    version: "1.1.1"
                },
                mapquest: {
                    ptype: "gxp_mapquestsource"
                },
                bing: {
                    ptype: "gxp_bingsource"
                },
                google: {
                    ptype: "gxp_googlesource"
                },
                osm: {
                    ptype: "gxp_osmsource"
                },
                mapbox: {
                    ptype: "gxp_mapboxsource"
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
