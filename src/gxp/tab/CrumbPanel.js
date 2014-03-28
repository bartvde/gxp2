Ext.define('gxp.tab.CrumbPanel', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.gxp_crumbpanel',
    widths: null,
    enableTabScroll: true,
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
        this.setActiveTab(this.items.getCount() - 1);
        cmp.on("hide", this.onCmpHide, this);
        //TODO investigate why hidden components are displayed again when
        // another crumb is activated - this just works around the issue
        cmp.getEl().dom.style.display = "";
    },
    onRemove: function(cmp) {
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
    onRender: function(cmp) {
        if (!this.initialConfig.itemTpl) {
            this.itemTpl = new Ext.Template(
                 '<li class="{cls} gxp-crumb" id="{id}"><div class="gxp-crumb-separator">\u00BB</div>',
                 '<a class="x-tab-right" href="#"><em class="x-tab-left">',
                 '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
                 '</em></a></li>'
            );
        }
        this.callParent(arguments);
        this.getEl().down("div").addCls("gxp-crumbpanel-header");
    },
    onCmpHide: function(cmp) {
        var lastIndex = this.items.getCount() - 1;
        if (this.items.indexOf(cmp) === lastIndex) {
            this.setActiveTab(this.getComponent(--lastIndex));
        }
    },
    setActiveTab: function(item) {
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
                this.remove(cmp, cmp.closeAction !== "hide");
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
