Ext.define('gxp.data.proxy.WFSProtocol', {
    extend: 'GeoExt.data.proxy.Protocol',
    alias: 'proxy.gxp_wfsprotocol',
    setFilter: function(filter) {
        this.protocol.filter = filter;
        // TODO: The protocol could use a setFilter method.
        this.protocol.options.filter = filter;
    },
    constructor: function(config) {

        Ext.applyIf(config, {

            /** api: config[version]
             *  ``String``
             *  WFS version.  Default is "1.1.0".
             */
            version: "1.1.0"

            /** api: config[maxFeatures]
             *  ``Number``
             *  Optional limit for number of features requested in a read.  No
             *  limit set by default.
             */

            /** api: config[multi]
             *  ``Boolean`` If set to true, geometries will be casted to Multi
             *  geometries before writing. No casting will be done for reading.
             */

        });

        // create the protocol if none provided
        if(!(this.protocol && this.protocol instanceof OpenLayers.Protocol)) {
            config.protocol = new OpenLayers.Protocol.WFS(Ext.apply({
                version: config.version,
                srsName: config.srsName,
                url: config.url,
                featureType: config.featureType,
                featureNS :  config.featureNS,
                geometryName: config.geometryName,
                schema: config.schema,
                filter: config.filter,
                maxFeatures: config.maxFeatures,
                multi: config.multi
            }, config.protocol));
        }
        this.callParent(arguments);
    },
    doRequest: function(operation, callback, scope) {
        if (operation.action === 'read') {
            this.callParent(arguments);
        } else if (operation.action !== 'destroy') {
            // TODO bartvde fix up commits
            if(!(records instanceof Array)) {
                records = [records];
            }
            // get features from records
            var features = new Array(records.length), feature;
            Ext.each(records, function(r, i) {
                features[i] = r.getFeature();
                feature = features[i];
                feature.modified = Ext.apply(feature.modified || {}, {
                    attributes: Ext.apply(
                        (feature.modified && feature.modified.attributes) || {},
                        r.modified
                    )
                });
            }, this);


            var o = {
                action: action,
                records: records,
                callback: callback,
                scope: scope
            };

            var options = {
                callback: function(response) {
                    this.onProtocolCommit(response, o);
                },
                scope: this
            };

            Ext.applyIf(options, params);

            this.protocol.commit(features, options);
        }

    },
    onProtocolCommit: function(response, o) {
        if(response.success()) {
            var features = response.reqFeatures;
            // deal with inserts, updates, and deletes
            var state, feature;
            var destroys = [];
            var insertIds = response.insertIds || [];
            var i, len, j = 0;
            for(i=0, len=features.length; i<len; ++i) {
                feature = features[i];
                state = feature.state;
                if(state) {
                    if(state == OpenLayers.State.DELETE) {
                        destroys.push(feature);
                    } else if(state == OpenLayers.State.INSERT) {
                        feature.fid = insertIds[j];
                        ++j;
                    } else if (feature.modified) {
                        feature.modified = {};
                    }
                    feature.state = null;
                }
            }

            for(i=0, len=destroys.length; i<len; ++i) {
                feature = destroys[i];
                feature.layer && feature.layer.destroyFeatures([feature]);
            }
            /**
             * TODO: Update the FeatureStore and FeatureReader to work with
             * callbacks from 3.0.
             *
             * The callback here is the result of store.createCallback.  The
             * signature should be what is expected by the anonymous function
             * created in store.createCallback: (data, response, success).  The
             * callback is a wrapped version of store.onCreateRecords etc.
             *
             * The onCreateRecords method calls reader.realize, which expects a
             * primary key in the data.  Though it *feels* like the job of the
             * reader, we need to create valid record data here (eventually to
             * be passed to reader.realize).  The reader.realize method calls
             * reader.extractValues - which seems like a nice place to grab the
             * fids from the features.  However, we need the fid in the data
             * object *before* extractValues is called.  So, we create a basic
             * data object with just the id (mapping determined by
             * reader.meta.idProperty or, for Ext > 3.0, reader.getId) and the
             * state property, which is always reset to null after a commit.
             *
             * After the reader.realize method determines that the data is valid
             * (determined by reader.isValid(data)), then extractValues gets
             * called - where it will create values objects (to be set as
             * record.data) from data.features.
             *
             * An important thing to note here is that though we may have "batch"
             * set to true, the store.save sequence issues one request per action.
             * So, we should *never* be here with a mix of features (deleted,
             * updated, created).
             *
             * Bottom line (based on my current understanding): we need to
             * implement extractValues for the FeatureReader.
             */
            len = features.length;
            var data = new Array(len);
            var f;
            for (i=0; i<len; ++i) {
                f = features[i];
                // TODO - check if setting the state to null here is appropriate,
                // or if feature state handling should rather be done in
                // GeoExt.data.FeatureStore
                data[i] = {id: f.id, feature: f, state: null};
                var fields = o.records[i].fields;
                for (var a in f.attributes) {
                    if (fields.containsKey(a)) {
                        data[i][a] = f.attributes[a];
                    }
                }
            }

            o.callback.call(o.scope, data, response.priv, true);
        } else {
            // TODO: determine from response if exception was "response" or "remote"
            var request = response.priv;
            if (request.status >= 200 && request.status < 300) {
                // service exception with 200
                this.fireEvent("exception", this, "remote", o.action, o, response.error, o.records);
            } else {
                // non 200 status
                this.fireEvent("exception", this, "response", o.action, o, request);
            }
            o.callback.call(o.scope, [], request, false);
        }

    }

});
