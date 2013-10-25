Ext.define('gxp.plugins.OLSource', {
    extend: 'gxp.plugins.LayerSource',
    requires: ['GeoExt.data.LayerModel'],
    alias: 'plugin.gxp_olsource',
    constructor: function(config) {
        this.mixins.observable.constructor.call(this, config);
        this.addEvents('ready', 'failure');
    },
    createLayerRecord: function(config) {

        var record;

        // get class based on type in config
        var Class = window;
        var parts = config.type.split(".");
        for (var i=0, ii=parts.length; i<ii; ++i) {
            Class = Class[parts[i]];
            if (!Class) {
                break;
            }
        }

        // TODO: consider static method on OL classes to construct instance with args
        if (Class && Class.prototype && Class.prototype.initialize) {
            // create a constructor for the given layer type
            var Constructor = function() {
                // this only works for args that can be serialized as JSON
                Class.prototype.initialize.apply(this, config.args);
            };
            Constructor.prototype = Class.prototype;

            // create a new layer given type and args
            var layer = new Constructor();

            // apply properties that may have come from saved config
            if ("visibility" in config) {
                layer.visibility = config.visibility;
            }

            // create a layer model for this layer
            Ext.define('gxp.data.OLLayer', {
                extend: 'GeoExt.data.LayerModel',
                fields: [
                    {name: "name", type: "string"},
                    {name: "source", type: "string"},
                    {name: "group", type: "string"},
                    {name: "fixed", type: "boolean"},
                    {name: "selected", type: "boolean"},
                    {name: "type", type: "string"},
                    {name: "args"}
                ]
            });
            var data = {
                layer: layer,
                title: layer.name,
                name: config.name || layer.name,
                source: config.source,
                group: config.group,
                fixed: ("fixed" in config) ? config.fixed : false,
                selected: ("selected" in config) ? config.selected : false,
                type: config.type,
                args: config.args,
                properties: ("properties" in config) ? config.properties : undefined
            };
            // TODO other fields
            record = Ext.create('GeoExt.data.LayerModel', layer);
        } else {
            throw new Error("Cannot construct OpenLayers layer from given type: " + config.type);
        }
        return record;
    },
    /** api: method[getConfigForRecord]
     *  :arg record: :class:`GeoExt.data.LayerRecord`
     *  :returns: ``Object``
     *
     *  Create a config object that can be used to recreate the given record.
     */
    getConfigForRecord: function(record) {
        // get general config
        var config = this.callParent(arguments);
        // add config specific to this source
        var layer = record.getLayer();
        return Ext.apply(config, {
            type: record.get("type"),
            args: record.get("args")
        });
    }
});
