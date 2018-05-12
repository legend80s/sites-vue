*可关注微信公众号”JavaScript与编程艺术“*

## 前言

> **Vue is Awesome!**

本文是继*“[Vue.js 模仿优酷北京女子图鉴下拉提示](https://mp.weixin.qq.com/s/_NIzlkBngFtOw0NXA307NQ)”*的后续篇，采用上文提到的 `provide / inject` 方式来改写“点击下拉提示结果自动替换到输入框”和“高亮匹配查询词”的功能。

![image-20180512223228841](/var/folders/qw/94j5541j7x3fchn9vy729mph0000gn/T/abnerworks.Typora/image-20180512223228841.png)

## 什么是 `provide / inject`

 `provide / inject` 是 Vue 组件通信四种方式之一，是一对对偶的组合子。上层组件通过 `provide` 提供依赖，底层组件通过 `inject` 获取依赖。

以官方的示例为例，我们先看下 `provide` 的写法。`provide` 可以是一个对象或返回对象的函数（`Object | () => Object`），对象的 `key` 是依赖获取时的句柄，`value` 可以是任意值，比如字符串、对象、函数等等。一旦被注入即可被任意子孙组件在以下生命周期 hook 中获取：`created`、`beforeMount`、`mounted`、`beforeDestroy`。注入的属性直接赋值在子孙组件的 `this` 上，比如上层组件定义如下：

```javascript
// parent component providing 'foo'
var GrandgrandParent = {
  provide: {
    foo: 'bar'
  },
  // ...
}
```

在子孙组件的 `created` hook 中可以这样使用：

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

**注意：**依赖注入的数据非 reactive，假如需要得自定义 `getter / setter`。

具体是上层组件定义依赖的 `getter / setter`，底层组件直接获取或设置该依赖的属性即可，因为 js 会自动调用  `getter / setter`，从而达到底层组件与上层组件通信的目的。

*getter / setter 必须是箭头函数，否则其 `this` 指向依赖本身而非 Vue 实例*。

**优点：**

较事件总线和触发自定义事件的方式而言

1. **耦合度更低。**因为中间组件无需将 bus 或需共用的属性借助中间组件传递下去，中间组件只要处理自己的业务即可。
2. **代码复杂度降低**。代码复杂度不会随着组件嵌套层次的加深而加大，避免属性需经过多层冗余组件的传递。同时避免为获取嵌套层次过深是写出这样丑陋的 hack 的代码：`this.$parent.map || this.$parent.$parent.map`。
3. **不限制嵌套层次**。

**缺点：**

- **重名冲突。**上层组件提供的依赖可能与底层组件的属性重名，而对于跨组件来说专为避免重名的 `Symbol` 也派不上用场。但其实是只要命名合理恰当，该缺点也不是什么大问题。

## 代码

### SearchBox 组件

代码变化如下：

1. 删除 `SuggestionList` 上绑定的自定义事件 `v-on:set-query="handleSetQuery"` 并将该逻辑置入 `setter` 中。
2. 删除 `v-bind:query="query"`。因为底层组件可通过 `inject` 拿到  `query`，无需再借助中间组件往底层组件传递该属性。

本文因为需要动态获取和更新 `query`，所以用了 `getter / setter`，故比示例稍微复杂一点。其中 `enumerable: true` 非必须。

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

      // 必须写成箭头函数，否则其 `this` 指向 `providers` 对象本身，而非 Vue 实例
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
### SuggestionList 组件

代码变化如下：

1. 删除捕获底层事件并抛往上层的逻辑。即删除绑定在 `SuggestionItem` 上的事件  `v-on:item-click="handleItemClick"`
2. 删除 `query` 属性。同理，该属性无需显示通过属性传递给底层组件

### SuggestionItem 组件

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

1. `provide / inject` 方式通过“依赖注入（DI）”的思想达到解耦的目的，Vue 中的 DI 的思想应该来源于 Angular.js。

2. `provide / inject` 其实是一种隐式的 `props`，Vue 称其为“long-range props”，除了以下几点和正常的 `prop` 不一样

   > 1. 祖先组件不需要知道哪些后代组件使用它提供的属性
   > 2. 后代组件不需要知道被注入的属性来自哪里

`provide / inject` 无需依赖中间组件，中间组件无需做任何非自身业务的事情，遵守了“S.O.L.I.D”原则当中的 Single Responsibility 和 Interface Segregation 原则。对于中等复杂度级别的应用来说该方法是最适宜的，如果数据流更复杂，推荐用专业状态管理工具 Vuex，敬请期待！

**代码见：**[feature/provide-inject]\(https://github.com/legend80s/sites-vue/tree/feature//provide-inject)

## 参考

1. provide / inject：https://vuejs.org/v2/api/#provide-inject
2. Dependency Injection：https://vuejs.org/v2/guide/components-edge-cases.html#Dependency-Injection
3. provide / inject 实例：https://medium.com/@znck/provide-inject-in-vue-2-2-b6473a7f7816
