import Vue from 'vue';
import 'gridmanager/css/gm.css';
import GridManager from 'gridmanager';

export default {
    name: 'GridManagerVue',
    // data: () => {
    //     return {
    //         gmData: null,
    //         gmError: null
    //     }
    // },
    props: {
        option: {
            type: Object,
            default: {},
        },
        callback: {
            type: Function,
            default: query => query,
        }
    },
    template: '<table></table>',
    mounted() {
        const _parent = this.$parent;

        // 包装ajax_success
        const ajax_success = this.option.ajax_success;
        this.option.ajax_success = (respones) => {
            // this.gmData = respones;
            ajax_success && ajax_success.call(_parent, respones);
        };

        // 包装ajax_error
        const ajax_error = this.option.ajax_error;
        this.option.ajax_error = (error) => {
            // this.gmError = error;
            ajax_error && ajax_error.call(_parent, error);
        };

        // 解析Vue 模版, data中的row为固定元素
        // compileList格式为[{th: td element, row: 行数据}]
        this.option.compileVue = (compileList) => {
            compileList.forEach(item => {
                const td = item.td;
                const attrList = [];

                // 递归存储attributes
                function getAllChildren(childNodes) {
                    childNodes.length > 0 && childNodes.forEach(ele => {
                        ele.attributes && attrList.push(ele.attributes);
                        ele.childNodes.length > 0 && getAllChildren(ele.childNodes);
                    });
                }

                getAllChildren(td.childNodes);


                // vue data
                const dataMap = {
                    row: item.row
                };

                // v-model
                const watchMap = {};

                // v-on
                const eventList = [];

                attrList.forEach(attributes => {
                    [].forEach.call(attributes, attr => {
                        // 当前属性异常或非Vue特定属性
                        if (!attr.name || !attr.value || !/:|@|v-/g.test(attr.name)) {
                            return;
                        }

                        // 特定属性不允许变更
                        if (attr.name === 'row') {
                            console.warn('GridManager warn: Vue attribute row can not be defined!');
                            return;
                        }

                        // 数据与事件
                        dataMap[attr.value] = _parent[attr.value];
                        dataMap[attr.name] = _parent[attr.value];

                        // 双向绑定, 监听数据
                        if (attr.name === 'v-model') {
                            watchMap[attr.value] = (newValue, oldValue) => {
                                _parent[attr.value] = newValue;
                            };
                        }

                        // 特殊处理: 包含()的函数
                        if (attr.value.indexOf('(') !== -1) {
                            const attrSplit = attr.value.split('(');
                            const fnName = attrSplit[0];
                            dataMap[fnName] = _parent[fnName];
                        }

                    });
                });

                new Vue({
                    el: td.firstChild,
                    data: () => dataMap,
                    watch: watchMap,
                    template: td.innerHTML
                });
            });
        };

        this.$el.GridManager('init', this.option, query => {
            this.callback(query);

            // 当前this指向的是 gridmanager
            // _parent 指向的是调用 gridmanager 的 components
            // GM.setScope 中需要传入的是当前实例化的table和所在域。而这域应该是_parent
            GridManager.setScope(this.$el, _parent);
        });
    },

    beforeCreate() {
    },
    created() {
    },
    updated() {
    },
    destroyed() {
        // 清除右键菜单
        const menuDomList = document.querySelectorAll('.grid-menu[grid-master]');
        [].forEach.call(menuDomList, menuDom => {
            menuDom.parentNode.removeChild(menuDom);
        });
    }
}
