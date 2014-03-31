Ext.define('gxp.tab.CrumbPanel', {
    extend: 'Ext.tab.Panel',
    alias: 'widget.gxp_crumbpanel',
    widths: null,
    enableTabScroll: true,
    initComponent: function() {
        this.tabBar = {
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
        };
        this.callParent(arguments);
        this.widths = {};
    },
    onBeforeAdd: function(cmp) {
        cmp.tabConfig = {
            renderTpl: [
                '<div class="gxp-crumb-separator">\u00BB</div>',
                '<span id="{id}-btnWrap" class="{baseCls}-wrap',
                '<tpl if="splitCls"> {splitCls}</tpl>',
                '{childElCls}" unselectable="on">',
                '<span id="{id}-btnEl" class="{baseCls}-button">',
                    '<span id="{id}-btnInnerEl" class="{baseCls}-inner {innerCls}',
                        '{childElCls}" unselectable="on">',
                        '{text}',
                    '</span>',
                    '<span role="img" id="{id}-btnIconEl" class="{baseCls}-icon-el {iconCls}',
                        '{childElCls} {glyphCls}" unselectable="on" style="',
                        '<tpl if="iconUrl">background-image:url({iconUrl});</tpl>',
                        '<tpl if="glyph && glyphFontFamily">font-family:{glyphFontFamily};</tpl>">',
                        '<tpl if="glyph">&#{glyph};</tpl><tpl if="iconCls || iconUrl">&#160;</tpl>',
                    '</span>',
                '</span>',
            '</span>',
            // if "closable" (tab) add a close element icon
            '<tpl if="closable">',
                '<span id="{id}-closeEl" class="{baseCls}-close-btn" title="{closeText}" tabIndex="0"></span>',
            '</tpl>']
        };
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
        //TODO investigate why hidden components are displayed again when
        // another crumb is activated - this just works around the issue
        cmp.getEl().dom.style.display = "none";
        this.activeTab.doLayout();
    },
    onCmpHide: function(cmp) {
        var lastIndex = this.items.getCount() - 1;
        if (!cmp.hidden && this.items.indexOf(cmp) === lastIndex) {
           this.remove(cmp, cmp.closeAction !== "hide");
           //this.setActiveTab(this.getComponent(--lastIndex));
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
