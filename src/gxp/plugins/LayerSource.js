Ext.define('gxp.plugins.LayerSource', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    constructor: function(config) {
        this.mixins.observable.constructor.call(this, config);
        this.addEvents('ready', 'failure');
    },
    init: function(target) {
        this.target = target;
        this.createStore();
    },
    /** private: method[getMapProjection]
     *  :returns: ``OpenLayers.Projection``
     */
    getMapProjection: function() {
        var projConfig = this.target.mapPanel.map.projection;
        return this.target.mapPanel.map.getProjectionObject() ||
            (projConfig && new OpenLayers.Projection(projConfig)) ||
            new OpenLayers.Projection("EPSG:4326");
    },
   
    /** api: method[getProjection]
     *  :arg layerRecord: ``GeoExt.data.LayerRecord`` a record from this
     *      source's store
     *  :returns: ``OpenLayers.Projection`` A suitable projection for the
     *      ``layerRecord``. If the layer is available in the map projection,
     *      the map projection will be returned. Otherwise an equal projection,
     *      or null if none is available.
     *
     *  Get the projection that the source will use for the layer created in
     *  ``createLayerRecord``. If the layer is not available in a projection
     *  that fits the map projection, null will be returned.
     */
    getProjection: function(layerRecord) {
        // to be overridden by subclasses
        var layer = layerRecord.getLayer();
        var mapProj = this.getMapProjection();
        var proj = layer.projection ?
            layer.projection instanceof OpenLayers.Projection ?
                layer.projection :
                new OpenLayers.Projection(layer.projection) :
            mapProj;
        return proj.equals(mapProj) ? mapProj : null;
    },

    /** api: method[createStore]
     *
     *  Creates a store of layer records.  Fires "ready" when store is loaded.
     */
    createStore: function() {
        this.fireEvent("ready", this);
    },
    /** api: method[createLayerRecord]
     *  :arg config:  ``Object``  The application config for this layer.
     *  :returns: ``GeoExt.data.LayerRecord``
     *
     *  Create a layer record given the config.
     */
    createLayerRecord: function(config) {
    },

    /** api: method[getConfigForRecord]
     *  :arg record: :class:`GeoExt.data.LayerRecord`
     *  :returns: ``Object``
     *
     *  Create a config object that can be used to recreate the given record.
     */
    getConfigForRecord: function(record) {
        var layer = record.getLayer();
        return {
            source: record.get("source"),
            name: record.get("name"),
            title: record.get("title"),
            visibility: layer.getVisibility(),
            opacity: layer.opacity || undefined,
            group: record.get("group"),
            fixed: record.get("fixed"),
            selected: record.get("selected")
        };
    },

    /** api: method[getState]
     *  :returns: ``Object``
     *
     *  Gets the configured source state.
     */
    getState: function() {
        //  Overwrite in subclasses to return anything other than a copy
        // of the initialConfig property.
        return Ext.apply({}, this.initialConfig);
    }
});
