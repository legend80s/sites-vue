*可关注微信公众号”JavaScript与编程艺术“*

## 前言

**Vue is Awesome!**

本文是继*“[Vue.js 模仿优酷北京女子图鉴下拉提示](https://mp.weixin.qq.com/s/_NIzlkBngFtOw0NXA307NQ)”*的后续篇，采用上文提到的 `provide / inject` 方式来改写“点击下拉提示结果自动替换到输入框”和“高亮匹配查询词”的功能。

## 思路

 `provide / inject` 是 Vue 组件通信四种方式的一种，是一对对偶的组合子。上层组件通过 `provide` 提供依赖，底层组件通过 `inject` 获取依赖。具体是上册组件定义 `getter` 和 `setter`，底层组件分别通过这两函数去获取或设置上层组件的属性，达到底层组件与上层组件通信的目的。

**优点：**

较事件总线和触发自定义事件的方式而言

1. **耦合度更低。**因为中间组件无需将 bus 或者需要共用的的属性借助中间组件传递下去，中间组件只要处理自己的业务即可。
2. **代码复杂度降低**。代码复杂度不会随着组件嵌套层次的加深而加大，避免属性经过多层中间组件的传递，。同时避免为获取嵌套层次过深是写出这样丑陋的 hack 的代码：`this.$parent.map || this.$parent.$parent.map`。
3. **不限制嵌套层次**。

**缺点：**

**可能有重名冲突。**上层组件提供的依赖可能和底层组件的属性重名，而对于跨组件来说专为避免重名的 `Symbol` 也派不上用场。但其实是只要命名合理恰当，该缺点也不是什么大问题。

## 代码

### SearchBox

我们先看下 `provide` 的写法。`provide` 可以是一个对象，或者返回对象的函数（`Object | () => Object`），对象的 `key` 是依赖获取时的句柄，`value` 可以是任意值，比如字符串、对象、函数等等。该对象一旦注入即可被任意子孙组件获取。对象内部的属性相当于直接赋值在子孙组件的 `this` 上，比如上层组件定义如下：

```javascript
// parent component providing 'foo'
var GrandgrandParent = {
  provide: {
    foo: 'bar'
  },
  // ...
}
```
在子孙组件中可以这样使用：

疑惑：为什么哪些 lifecycle hook 中可以使用依赖注入？todo

```javascript
// child component injecting 'foo'
var Child = {
  inject: ['foo'],
  created () {
    console.log(this.foo) // => "bar"
  }
  // ...
}
```
代码变化如下：

1. 删除 `SuggestionList` 上绑定的自定义事件 `v-on:set-query="handleSetQuery"` 并将该逻辑置入 `setter` 中。
2. 删除 `v-bind:query="query"`。因为底层组件可通过 `inject` 拿到  `query`，所以无需借助中间组件往底层组件传递该属性。

 `provide / inject` 的绑定不是 reactive 的，但本文因为需要动态获取和更新 `query`，所以用了 `getter / setter`，故比示例稍微复杂一点。其中 `enumerable: true` 非必须。

```javascript
// src/components/SearchBox.vue

export default {
  name: 'SearchBox',
  // ...
  // 增加 `provide`
  provide() {
    const providers = {};

    Object.defineProperty(providers, 'query', {
      // enumerable: true,

      get: () => this.query,
      set: (newQuery) => {
        // console.log('set query from', this.query, 'to', newQuery);

        this.query = newQuery;
      },
    });

    return { providers };
  },
};
```
### SuggestionList 

代码变化如下：

1. 删除捕获底层事件并抛往上层的逻辑，即删除绑定在 `SuggestionItem` 上的事件  `v-on:item-click="handleItemClick"`
2. 删除 `query` 属性。该属性无需显示通过属性传递给底层组件

### SuggestionItem

代码变化如下：

1. 增加依赖注入描述。
2. 删除 `query` 属性，改为从依赖中取。
3. 无需触发自定义事件，改为直接设置依赖中相应的属性即可。

```javascript
// src/components/SuggestionItem.vue

export default {
  name: 'SuggestionItem',
  // ...
  // 1. 加入依赖注入描述
  inject: ['providers'],

  computed: {
    /**
     * 返回加粗后的下拉提示
     * @return {string}
     */
    hilighted() {
      // 2. query 直接从依赖获取
      const boldQuerySegement = this.suggestion.value.replace(this.providers.query, matched => `<b>${matched}</b>`);

      return boldQuerySegement;
    },
  },

  methods: {
    handleClick({ value }) {
      // 3. 直接设置依赖的 `query` 属性，无需在主动 `emit` 事件
      this.providers.query = value;
    },
  },
};
```

## 总结

 `provide / inject` 方式通过“依赖注入（DI）”的思想达到解耦的目的，该 DI 的思想应该来源于 Angular.js。为什么 DI 可以解耦？todo

> - ancestor components don’t need to know which descendants use the properties it provides
> - descendant components don’t know need to know where injected properties are coming from

该通信方式无需依赖中间组件，中间组件无需做任何非自身业务的事情，遵守了“S.O.L.I.D”原则当中的 Single Responsibility 和 Interface Segregation 原则。对于中等复杂度级别的应用来说该方法是最适宜的，如果数据流更复杂，推荐用专业状态管理工具 Vuex，敬请期待！

**代码见：**[feature/provide-inject]\(https://github.com/legend80s/sites-vue/tree/feature//provide-inject)

## 参考

1. provide / inject：https://vuejs.org/v2/api/#provide-inject
2. provide / inject 实例：https://medium.com/@znck/provide-inject-in-vue-2-2-b6473a7f7816