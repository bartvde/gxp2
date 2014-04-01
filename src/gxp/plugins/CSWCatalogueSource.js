Ext.define('gxp.data.CswRecordsModel',{
    extend: 'GeoExt.data.CswRecordsModel',
    fields: [
        {name: "abstract"},
        {name: "references"}
    ]
});

Ext.define('gxp.plugins.CSWCatalogueSource', {
    extend: 'gxp.plugins.CatalogueSource',
    requires: ['GeoExt.data.proxy.Protocol', 'GeoExt.data.reader.CswRecords', 'GeoExt.data.CswRecordsModel'],
    alias: 'plugin.gxp_cataloguesource',
    createStore: function() {
        this.store = Ext.create('Ext.data.Store', {
            model: 'gxp.data.CswRecordsModel',
            proxy: Ext.create('GeoExt.data.proxy.Protocol', Ext.apply({
                setParamsAsOptions: true,
                reader: new GeoExt.data.reader.CswRecords(),
                protocol: new OpenLayers.Protocol.CSW({
                    url: this.url
                })
            }, this.proxyOptions || {}))
        });
        gxp.plugins.LayerSource.prototype.createStore.apply(this, arguments);
    },
    getPagingStart: function() {
        return 1;
    },
    getPagingParamNames: function() {
        return {
            start: 'startPosition',
            limit: 'maxRecords'
        };
    },
    getFullFilter: function(filter, otherFilters) {
        var filters = [];
        if (filter !== undefined) {
            filters.push(filter);
        }
        filters = filters.concat(otherFilters);
        if (filters.length <= 1) {
            return filters[0];
        } else {
            return new OpenLayers.Filter.Logical({
                type: OpenLayers.Filter.Logical.AND,
                filters: filters
            });
        }
    },
    filter: function(options) {
        var filter = undefined;
        if (options.queryString !== "") {
            filter = new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.LIKE,
                matchCase: false,
                property: 'csw:AnyText',
                value: '*' + options.queryString + '*'
            });
        }
        var data = {
            "resultType": "results",
            "maxRecords": options.limit,
            "Query": {
                "typeNames": "gmd:MD_Metadata",
                "ElementSetName": {
                    "value": "full"
                }
            }
        };
        var fullFilter = this.getFullFilter(filter, options.filters);
        if (fullFilter !== undefined) {
            Ext.apply(data.Query, {
                "Constraint": {
                    version: "1.1.0",
                    Filter: fullFilter
                }
            });
        }
        Ext.apply(this.store.proxy.extraParams, data);
        this.store.load();
    }
});
