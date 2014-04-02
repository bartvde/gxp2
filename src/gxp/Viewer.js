Ext.define('gxp.Viewer', {
    defaultToolType: "gxp_tool",
    mixins: {
        observable: 'Ext.util.Observable'
    },
    requires: ['Ext.Ajax', 'Ext.PluginManager', 'gxp.util', 'Ext.layout.container.Border', 'Ext.panel.Panel', 'Ext.Toolbar', 'GeoExt.panel.Map'],
    constructor: function(config) {
        if (config.proxy) {
            OpenLayers.ProxyHost = config.proxy;
            var createComplete = function(fn, cb) {
                return function(request) {
                    if(cb && cb[fn]) {
                        cb[fn].apply(cb.scope || window, [cb.argument, (fn == "success"), request]);
                    }
                };
            };
            Ext.apply(Ext.Ajax, {
                request: function(options) {
                    var data, method;
                    options = options || {};
                    method = options.method;
                    var hs = options.headers;
                    if(options.xmlData) {
                        if(!hs || !hs["Content-Type"]) {
                            hs = hs || {};
                            hs["Content-Type"] = "text/xml";
                        }
                        method = method || "POST";
                        data = options.xmlData;
                    } else if(options.jsonData) {
                        if(!hs || !hs["Content-Type"]) {
                            hs = hs || {};
                            hs["Content-Type"] = "application/json";
                        }
                        method = method || "POST";
                        data = typeof options.jsonData == "object" ?
                        Ext.encode(options.jsonData) : options.jsonData;
                    }
                    // if POST method, options.form or options.params means
                    // form-encoded data, so change content-type
                    if ((method && method.toLowerCase() == "post") &&
                      (options.form || options.params) &&
                      (!hs || !hs["Content-Type"])) {
                        hs = hs || {};
                        hs["Content-Type"] = "application/x-www-form-urlencoded";
                    }
                    return OpenLayers.Request.issue({
                        success: createComplete("success", {success: options.callback, argument: options, scope: options.scope}),
                        failure: createComplete("failure", {failure: options.callback, argument: options, scope: options.scope}),
                        method: method,
                        headers: hs,
                        params: options.params,
                        data: data,
                        url: options.url
                    });
                },
                isCallInProgress: function(request) {
                    // do not prevent our caller from calling abort()
                    return true;
                },
                abort: function(request) {
                    request.abort();
                }
            });
        }
        this.mixins.observable.constructor.call(this, config);
        this.addEvents(
            "ready",
            "beforecreateportal",
            "portalready",
            "beforelayerselectionchange",
            "layerselectionchange",
            "featureedit",
            "authorizationchange",
            "beforesave",
            "save",
            "beforehashchange"
        );
        Ext.apply(this, {
            layerSources: {},
            portalItems: [],
            menus: {}
        });

        // private array of pending getLayerRecord requests
        this.createLayerRecordQueue = [];

        (config.loadConfig || this.loadConfig).call(this, config, this.applyConfig);
    },
    loadConfig: function(config) {
        this.applyConfig(config);
    },
    applyConfig: function(config) {
        this.initialConfig = Ext.apply({}, config);
        Ext.apply(this, this.initialConfig);
        this.load();
    },
    activate: function() {
        // initialize tooltips
        Ext.QuickTips.init();

        // add any layers from config
        this.addLayers();

        // respond to any queued requests for layer records
        this.checkLayerRecordQueue();

        // broadcast ready state
        this.fireEvent("ready");
    },
    addLayers: function() {
        var mapConfig = this.initialConfig.map;
        if(mapConfig && mapConfig.layers) {
            var conf, source, record, baseRecords = [], overlayRecords = [];
            for (var i=0; i<mapConfig.layers.length; ++i) {
                conf = mapConfig.layers[i];
                source = this.layerSources[conf.source];
                // source may not have loaded properly (failure handled elsewhere)
                if (source) {
                    record = source.createLayerRecord(conf);
                    if (record) {
                        if (record.get("group") === "background") {
                            baseRecords.push(record);
                        } else {
                            overlayRecords.push(record);
                        }
                    }
                } else if (window.console) {
                    console.warn("Non-existing source '" + conf.source + "' referenced in layer config.");
                }
            }

            var panel = this.mapPanel;
            var map = panel.map;

            var records = baseRecords.concat(overlayRecords);
            if (records.length) {
                panel.layers.add(records);
            }

        }
    },
    load: function() {
        this.initMapPanel();
        this.initTools();
        // initialize all layer source plugins
        var config, queue = [];
        for (var key in this.sources) {
            queue.push(this.createSourceLoader(key));
        }

        // create portal when dom is ready
        queue.push(function(done) {
            Ext.onReady(function() {
                this.initPortal();
                done();
            }, this);
        });

        gxp.util.dispatch(queue, this.activate, this);
    },
    createSourceLoader: function(key) {
        return function(done) {
            var config = this.sources[key];
            config.projection = this.initialConfig.map.projection;
            this.addLayerSource({
                id: key,
                config: config,
                callback: done,
                fallback: function(source, msg, details) {
                    // TODO: log these issues somewhere that the app can display
                    // them after loading.
                    // console.log(arguments);
                    done();
                },
                scope: this
            });
        };
    },
    addLayerSource: function(options) {
        var id = options.id || Ext.id(null, "gxp-source-");
        var source;
        var config = options.config;
        config.id = id;
        try {
            source = Ext.PluginManager.create(
                config, this.defaultSourceType
            );
        } catch (err) {
            throw new Error("Could not create new source plugin with ptype: " + options.config.ptype);
        }
        source.on({
            ready: {
                fn: function() {
                    var callback = options.callback || Ext.emptyFn;
                    callback.call(options.scope || this, id);
                },
                scope: this,
                single: true
            },
            failure: {
                fn: function() {
                    var fallback = options.fallback || Ext.emptyFn;
                    delete this.layerSources[id];
                    fallback.apply(options.scope || this, arguments);
                },
                scope: this,
                single: true
            }
        });
        this.layerSources[id] = source;
        source.init(this);

        return source;
    },
    initMapPanel: function() {
    
        var config = Ext.apply({}, this.initialConfig.map);
        var mapConfig = {};
        var baseLayerConfig = {
            wrapDateLine: config.wrapDateLine !== undefined ? config.wrapDateLine : true,
            maxResolution: config.maxResolution,
            numZoomLevels: config.numZoomLevels,
            displayInLayerSwitcher: false
        };
    
        // split initial map configuration into map and panel config
        if (this.initialConfig.map) {
            var props = "theme,controls,resolutions,projection,units,maxExtent,restrictedExtent,maxResolution,numZoomLevels,panMethod".split(",");
            var prop;
            for (var i=props.length-1; i>=0; --i) {
                prop = props[i];
                if (prop in config) {
                    mapConfig[prop] = config[prop];
                    delete config[prop];
                }
            }
        }

        this.mapPanel = Ext.create('GeoExt.panel.Map', Ext.applyIf({
            layout: "border",
            map: Ext.applyIf({
                theme: mapConfig.theme || null,
                controls: mapConfig.controls || [
                    new OpenLayers.Control.Navigation({
                        zoomWheelOptions: {interval: 250},
                        dragPanOptions: {enableKinetic: true}
                    }),
                    new OpenLayers.Control.PanPanel(),
                    new OpenLayers.Control.ZoomPanel(),
                    new OpenLayers.Control.Attribution()
                ],
                maxExtent: mapConfig.maxExtent && OpenLayers.Bounds.fromArray(mapConfig.maxExtent),
                restrictedExtent: mapConfig.restrictedExtent && OpenLayers.Bounds.fromArray(mapConfig.restrictedExtent),
                numZoomLevels: mapConfig.numZoomLevels || 20
            }, mapConfig),
            center: config.center && new OpenLayers.LonLat(config.center[0], config.center[1]),
            resolutions: config.resolutions,
            forceInitialExtent: true,
            layers: [new OpenLayers.Layer(null, baseLayerConfig)],
            items: this.mapItems,
            plugins: this.mapPlugins,
            tbar: config.tbar || Ext.create('Ext.Toolbar', {
                hidden: true
            })
        }, config));
        this.mapPanel.getDockedItems('toolbar[dock=top]')[0].on({
            afterlayout: this.mapPanel.map.updateSize,
            show: this.mapPanel.map.updateSize,
            hide: this.mapPanel.map.updateSize,
            scope: this.mapPanel.map
        });

        this.mapPanel.layers.on({
            "add": function(store, records) {
                // check selected layer status
                var record;
                for (var i=records.length-1; i>= 0; i--) {
                    record = records[i];
                    if (record.get("selected") === true) {
                        this.selectLayer(record);
                    }
                }
            },
            "remove": function(store, record) {
                if (record.get("selected") === true) {
                    this.selectLayer();
                }
            },
            scope: this
        });
    },
    initPortal: function() {
    
        var config = Ext.apply({}, this.portalConfig);

        if (this.portalItems.length === 0) {
            this.mapPanel.region = "center";
            this.portalItems.push(this.mapPanel);
        }
        var name;
        if (config.renderTo) {
            name = 'Ext.panel.Panel';
        } else {
            name = 'Ext.container.Viewport';
        }
        this.portal = Ext.create(name, Ext.applyIf(config, {
            layout: "fit",
            hideBorders: true,
            items: {
                layout: "border",
                deferredRender: false,
                items: this.portalItems
            }
        }));

        this.fireEvent("portalready");
    },
    checkLayerRecordQueue: function() {
        var request, source, s, record, called;
        var remaining = [];
        for (var i=0, ii=this.createLayerRecordQueue.length; i<ii; ++i) {
            called = false;
            request = this.createLayerRecordQueue[i];
            s = request.config.source;
            if (s in this.layerSources) {
                source = this.layerSources[s];
                record = source.createLayerRecord(request.config);
                if (record) {
                    // we call this in the next cycle to guarantee that
                    // createLayerRecord returns before callback is called
                    (function(req, rec) {
                        window.setTimeout(function() {
                            req.callback.call(req.scope, rec);
                        }, 0);
                    })(request, record);
                    called = true;
                } else if (source.lazy) {
                    source.store.load({
                        callback: this.checkLayerRecordQueue,
                        scope: this
                    });
                }
            }
            if (!called) {
                remaining.push(request);
            }
        }
        this.createLayerRecordQueue = remaining;
    },
    selectLayer: function(record) {
        record = record || null;
        var changed = false;
        var allow = this.fireEvent("beforelayerselectionchange", record);
        if (allow !== false) {
            changed = true;
            if (this.selectedLayer) {
                this.selectedLayer.set("selected", false);
            }
            this.selectedLayer = record;
            if (this.selectedLayer) {
                this.selectedLayer.set("selected", true);
            }
            this.fireEvent("layerselectionchange", record);
        }
        return changed;
    },
    initTools: function() {
        this.tools = {};
        if (this.initialConfig.tools && this.initialConfig.tools.length > 0) {
            var tool;
            for (var i=0, len=this.initialConfig.tools.length; i<len; i++) {
                var msg = "Could not create tool plugin with ptype: " + this.initialConfig.tools[i].ptype;
                try {
                    tool = Ext.PluginManager.create(
                        this.initialConfig.tools[i], this.defaultToolType
                    );
                } catch (err) {
                    throw new Error(msg);
                }
                if (tool === null) {
                    throw new Error(msg);
                }
                tool.init(this);
            }
        }
    },
    isAuthorized: function(roles) {
        /**
         * If the application doesn't support authentication, we expect
         * authorizedRoles to be undefined.  In this case, from the UI
         * perspective, we treat the user as if they are authorized to do
         * anything.  This will result in just-in-time authentication challenges
         * from the browser where authentication credentials are needed.
         * If the application does support authentication, we expect
         * authorizedRoles to be a list of roles for which the user is
         * authorized.
         */
        var authorized = true;
        if (this.authorizedRoles) {
            authorized = false;
            if (!roles) {
                roles = "ROLE_ADMINISTRATOR";
            }
            if (!Ext.isArray(roles)) {
                roles = [roles];
            }
            for (var i=roles.length-1; i>=0; --i) {
                if (~this.authorizedRoles.indexOf(roles[i])) {
                    authorized = true;
                    break;
                }
            }
        }
        return authorized;
    },
    doAuthorized: function(roles, callback, scope) {
        if (this.isAuthorized(roles) || !this.authenticate) {
            window.setTimeout(function() { callback.call(scope); }, 0);
        } else {
            this.authenticate();
            this._authFn = function authFn() {
                delete this._authFn;
                this.doAuthorized(roles, callback, scope, true);
            };
            this.on("authorizationchange", this._authFn, this, {single: true});
        }
    },
    getSource: function(layerRec) {
        return layerRec && this.layerSources[layerRec.get("source")];
    }
});

(function() {
    // OGC "standardized rendering pixel size"
    OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
})();
