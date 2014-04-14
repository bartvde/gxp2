/**
 * @requires form/FillSymbolizer.js
 * @requires form/StrokeSymbolizer.js
 */

Ext.define('gxp.panel.PointSymbolizer', {
    extend: 'Ext.panel.Panel',
    requires: ['gxp.form.FillSymbolizer', 'gxp.form.StrokeSymbolizer'],
    alias: 'widget.gxp_pointsymbolizer',
    symbolizer: null,
    graphicCircleText: "circle",
    graphicSquareText: "square",
    graphicTriangleText: "triangle",
    graphicStarText: "star",
    graphicCrossText: "cross",
    graphicXText: "x",
    graphicExternalText: "external",
    urlText: "URL",
    opacityText: "opacity",
    symbolText: "Symbol",
    sizeText: "Size",
    rotationText: "Rotation",
    pointGraphics: null,
    colorManager: null,
    external: null,
    layout: "form",
    initComponent: function() {

        if(!this.symbolizer) {
            this.symbolizer = {};
        }

        if (!this.pointGraphics) {
            this.pointGraphics = [
                {display: this.graphicCircleText, value: "circle", mark: true},
                {display: this.graphicSquareText, value: "square", mark: true},
                {display: this.graphicTriangleText, value: "triangle", mark: true},
                {display: this.graphicStarText, value: "star", mark: true},
                {display: this.graphicCrossText, value: "cross", mark: true},
                {display: this.graphicXText, value: "x", mark: true},
                {display: this.graphicExternalText}
            ];
        }

        this.external = !!this.symbolizer["externalGraphic"];

        this.markPanel = new Ext.Panel({
            border: false,
            collapsed: this.external,
            layout: "form",
            items: [{
                xtype: "gxp_fillsymbolizer",
                symbolizer: this.symbolizer,
                labelWidth: this.labelWidth,
                labelAlign: this.labelAlign,
                colorManager: this.colorManager,
                listeners: {
                    change: function(symbolizer) {
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }, {
                xtype: "gxp_strokesymbolizer",
                symbolizer: this.symbolizer,
                labelWidth: this.labelWidth,
                labelAlign: this.labelAlign,
                colorManager: this.colorManager,
                listeners: {
                    change: function(symbolizer) {
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                }
            }]
        });
        this.urlField = new Ext.form.TextField({
            name: "url",
            fieldLabel: this.urlText,
            value: this.symbolizer["externalGraphic"],
            hidden: !this.external,
            listeners: {
                change: function(field, value) {
                    this.symbolizer["externalGraphic"] = value;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        });

        this.graphicPanel = new Ext.Panel({
            border: false,
            collapsed: !this.external,
            layout: "form",
            items: [this.urlField, {
                xtype: "slider",
                name: "opacity",
                fieldLabel: this.opacityText,
                value: [(this.symbolizer["graphicOpacity"] == null) ? 100 : this.symbolizer["graphicOpacity"] * 100],
                isFormField: true,
                listeners: {
                    changecomplete: function(slider, value) {
                        this.symbolizer["graphicOpacity"] = value / 100;
                        this.fireEvent("change", this.symbolizer);
                    },
                    scope: this
                },
                plugins: [
                    new GeoExt.SliderTip({
                        getText: function(thumb) {
                            return thumb.value + "%";
                        }
                    })
                ],
                width: 100 // TODO: push this to css
            }]
        });
        this.items = [{
            xtype: "combo",
            name: "mark",
            fieldLabel: this.symbolText,
            store: new Ext.data.JsonStore({
                data: {root: this.pointGraphics},
                root: "root",
                fields: ["value", "display", "preview", {name: "mark", type: "boolean"}]
            }),
            value: this.external ? 0 : this.symbolizer["graphicName"],
            displayField: "display",
            valueField: "value",
            tpl: new Ext.XTemplate(
                '<tpl for=".">' +
                    '<div class="x-combo-list-item gx-pointsymbolizer-mark-item">' +
                    '<tpl if="preview">' +
                        '<img src="{preview}" alt="{display}"/>' +
                    '</tpl>' +
                    '<span>{display}</span>' +
                '</div></tpl>'
            ),
            mode: "local",
            allowBlank: false,
            triggerAction: "all",
            editable: false,
            listeners: {
                select: function(combo, record) {
                    var mark = record.get("mark");
                    var value = record.get("value");
                    if(!mark) {
                        if(value) {
                            this.urlField.hide();
                            this.symbolizer["externalGraphic"] = value;
                        } else {
                            this.urlField.show();
                        }
                        if(!this.external) {
                            this.external = true;
                            var urlValue = this.urlField.getValue();
                            if (!Ext.isEmpty(urlValue)) {
                                this.symbolizer["externalGraphic"] = urlValue;
                            }
                            delete this.symbolizer["graphicName"];
                            this.updateGraphicDisplay();
                        }
                    } else {
                        if(this.external) {
                            this.external = false;
                            delete this.symbolizer["externalGraphic"];
                            this.updateGraphicDisplay();
                        }
                        this.symbolizer["graphicName"] = value;
                    }
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, {
            xtype: "textfield",
            name: "size",
            fieldLabel: this.sizeText,
            value: this.symbolizer["pointRadius"] && this.symbolizer["pointRadius"] * 2,
            listeners: {
                change: function(field, value) {
                    this.symbolizer["pointRadius"] = value / 2;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, {
            xtype: "textfield",
            name: "rotation",
            fieldLabel: this.rotationText,
            value: this.symbolizer["rotation"],
            listeners: {
                change: function(field, value) {
                    this.symbolizer["rotation"] = value;
                    this.fireEvent("change", this.symbolizer);
                },
                scope: this
            },
            width: 100 // TODO: push this to css
        }, this.markPanel, this.graphicPanel
        ];
        this.addEvents(
            "change"
        );
        this.callParent(arguments);
    },
    updateGraphicDisplay: function() {
        if(this.external) {
            this.markPanel.collapse();
            this.graphicPanel.expand();
        } else {
            this.graphicPanel.collapse();
            this.markPanel.expand();
        }
        // TODO: window shadow fails to sync
    }
});
