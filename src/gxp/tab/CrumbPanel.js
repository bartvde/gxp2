Ext.define('gxp.tab.CrumbPanel', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.gxp_crumbpanel',
    widths: null,
    enableTabScroll: true,
    tabBar: {
        renderTpl: [
        '<div id="{id}-body" class="{baseCls}-body {bodyCls} {bodyTargetCls}{childElCls}<tpl if="ui"> {baseCls}-body-{ui}<tpl for="uiCls"> {parent.baseCls}-body-{parent.ui}-{.}</tpl></tpl> gxp-crumb"<tpl if="bodyStyle"> style="{bodyStyle}"</tpl>>',
            '{%this.renderContainer(out,values)%}',
        '</div>',
        '<div id="{id}-strip" class="{baseCls}-strip {baseCls}-strip-{dock}{childElCls}',
            '<tpl if="ui"> {baseCls}-strip-{ui}',
                '<tpl for="uiCls"> {parent.baseCls}-strip-{parent.ui}-{.}</tpl>',
            '</tpl>">',
        '</div>'
        ]
    },
    initComponent: function() {
        this.callParent(arguments);
        this.widths = {};
    },
    onBeforeAdd: function(cmp) {
        this.callParent(arguments);
        if (cmp.shortTitle) {
            cmp.title = cmp.shortTitle;
        }
    },
    onAdd: function(cmp) {
        this.callParent(arguments);
        cmp.on("hide", this.onCmpHide, this);
    },
    onRemove: function(cmp) {
        this.callParent(arguments);
        cmp.un("hide", this.onCmpHide, this);
    },
    _onRemove: function(cmp) {
        this.callParent(arguments);
        cmp.un("hide", this.onCmpHide, this);
        var previousWidth = this.widths[this.getComponent(this.items.getCount()-1).id];
        if (previousWidth && previousWidth < this.getWidth()) {
            this.setWidth(previousWidth);
            /*if (this.ownerCt) {
                this.ownerCt.syncSize();
            }*/
        }
        //TODO investigate why hidden components are displayed again when
        // another crumb is activated - this just works around the issue
        cmp.getEl().dom.style.display = "none";
        this.activeTab.doLayout();
    },
    _onRender: function(cmp) {/*
        if (!this.initialConfig.itemTpl) {
            this.itemTpl = new Ext.Template(

                 '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
                 '<a class="x-tab-right" href="#"><em class="x-tab-left">',
                 '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
                 '</em></a></li>'


                 '<li class="{cls} gxp-crumb" id="{id}"><div class="gxp-crumb-separator">\u00BB</div>',
                 '<a class="x-tab-right" href="#"><em class="x-tab-left">',
                 '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
                 '</em></a></li>'
            );
        }*/
        this.callParent(arguments);
        this.getEl().down("div").addCls("gxp-crumbpanel-header");
    },
    onCmpHide: function(cmp) {
        var lastIndex = this.items.getCount() - 1;
        if (!cmp.hidden && this.items.indexOf(cmp) === lastIndex) {
           this.remove(cmp, cmp.closeAction !== "hide");
            //this.setActiveTab(this.getComponent(--lastIndex));
        }
    },
    _setActiveTab: function(item) {
        var index;
        if (Ext.isNumber(item)) {
            index = item;
            item = this.getComponent(index);
        } else {
            index = this.items.indexOf(item);
        }
        if (~index) {
            var cmp, i;
            for (i=this.items.getCount()-1; i>index; --i) {
                cmp = this.getComponent(i);
                // remove, but don't destroy if component was configured with
                // {closeAction: "hide"}
                //this.remove(cmp, cmp.closeAction !== "hide");
            }
        }
        var width = item.initialConfig.minWidth || item.initialConfig.width,
            previousWidth = this.getWidth();
        if (width > previousWidth) {
            this.widths[this.getComponent(index - 1).id] = previousWidth;
            this.setWidth(width);
            /*if (this.ownerCt) {
                this.ownerCt.syncSize();
            }*/
        }
        this.callParent(arguments);
    }
});
