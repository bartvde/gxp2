Ext.define('gxp.plugins.LayerTree', {
    extend: 'gxp.plugins.Tool',
    requires: [
        'Ext.tree.TreePanel',
        'Ext.data.TreeStore',
        'GeoExt.data.LayerTreeModel',
        'GeoExt.tree.OverlayLayerContainer',
        'GeoExt.tree.BaseLayerContainer'
    ],
    alias: 'plugin.gxp_layertree',
    shortTitle: "Layers",
    rootNodeText: "Layers",
    overlayNodeText: "Overlays",
    baseNodeText: "Base Layers",
    groups: null,
    defaultGroup: "default",
    constructor: function(config) {
        this.callParent(arguments);
        if (!this.groups) {
            this.groups = {
                "default": this.overlayNodeText,
                "background": {
                    title: this.baseNodeText,
                    exclusive: true
                }
            };
        }
    },
    init: function(target) {
        this.callParent(arguments);
        this.store = Ext.create('Ext.data.TreeStore', {
            model: 'GeoExt.data.LayerTreeModel',
            root: {
                expanded: true,
                text: this.rootNodeText,
                children: [{
                    plugins: ['gx_baselayercontainer'],
                    expanded: true,
                    text: this.baseNodeText
                }, {
                    plugins: ['gx_overlaylayercontainer'],
                    expanded: true,
                    text: this.overlayNodeText
                }]
            }
        });
    },
    addOutput: function(config) {
        config = Ext.apply(this.createOutputConfig(), config || {});
        var output = this.callParent([config]);
        output.on({
            itemcontextmenu: {fn: this.handleTreeContextMenu},
            beforemovenode: {fn: this.handleBeforeMoveNode},
            scope: this
        });
        return output;
    },
    createOutputConfig: function() {
        // TODO restore all of the old functionality
        return {
            xtype: 'treepanel',
            store: this.store
        };
    }
});
