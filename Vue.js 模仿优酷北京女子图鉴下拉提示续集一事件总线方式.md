*可关注微信公众号”JavaScript与编程艺术“*

## 前言

**Vue is Awesome!**

> *Angular.js 明显有坑，React 没有明显的坑，Vue.js 明显没有坑*

![北京女子图鉴](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-work-at-weekend.png)

本文是继 *“Vue.js 模仿优酷北京女子图鉴下拉提示”* 的后续篇，采用全局事件总线方式改写“点击下拉提示结果自动替换到输入框”的功能。

总体思路：最上层组件初始化事件总线（bus）并监听该总线上的感兴趣的事件，中间组件负责向下传递总线，目标组件则通过该总线触发事件。

该方式较手动事件“冒泡”的优点在于：

1. 代码简洁。中间组件无需截获底层组件的事件然后向上抛出。
2. 耦合减轻。中间组件无需了解底层组件抛出的事件是什么，也无需关心往上层组件抛怎样的事件以及如何抛。

具体代码如下

```vue
<!-- src/components/SearchBox.vue -->

<template>
  <el-form @submit.native.prevent="search" class="search-box">
    <!-- 将事件总线往下传递给 SuggestionList -->
    <SuggestionList
      v-if="suggestions.length > 0"

      :suggestions="suggestions"
      :query="query"

      :bus="bus"
    />
  </el-form>
</template>

<script>
import Vue from 'vue';

export default {
  name: 'SearchBox',

  data() {
    return {
      query: '',
      suggestions: [],

      // 事件总线必须能够触发和监听事件，可以是一个 Vue 实例
      bus: new Vue(),
    };
  },

  created() {
    this.fetchSuggestions();
    // 监听事件
    this.bus.$on('set-query', this.handleSetQuery);
  },
};
</script>
```

```vue
<!-- src/components/SuggestionList.vue -->

<template>
  <div class="suggestion-list-wrapper">
    <ol>
      <!-- 中间组件将事件总线往下传递给 SuggestionItem -->
      <SuggestionItem
        v-for="(suggestion, index) in suggestions"

        :key="index"
        :suggestion="suggestion"
        :query="query"

        :bus="bus"
      ></SuggestionItem>
    </ol>
  </div>
</template>

<script>
import Vue from 'vue';

// 无需向上冒泡事件，只需将 `bus` 往下传递，代码更精简、更加解耦
export default {
  name: 'SuggestionList',

  props: {
    // ...

    bus: {
      type: Vue,
      required: true,
    },
  },

  // ...
};
</script>
```

```vue
<!-- src/components/SuggestionItem.vue -->

<template>
  <li
    @click="handleClick(suggestion)"
  >
    <span :class="{ top3: suggestion.index < 3 }">{{ suggestion.index + 1 }}. </span>
    <span v-html="hilighted"></span>
  </li>
</template>

<script>
import Vue from 'vue';

export default {
  name: 'SuggestionItem',

  props: {

    // bus 是 Vue 的实例
    bus: {
      type: Vue,
      required: true,
    },
  },

  methods: {
    /**
     * 处理点击事件
     * 触发自定义事件 `set-query`，感兴趣的组件监听该事件去做任何事情
     * @param  {string} options.value 被点击的下拉提示
     * @return {void}
     */
    handleClick({ value }) {
      this.bus.$emit('set-query', value);
    },
  },
};
</script>
```

## 总结

1. bus 可以是任何具备 `$emit` 和 `$on` 即触发和监听事件能力的对象，一般在 Vue 中我们就用 Vue 的实例即可。
2. 与原生事件的监听回调的触发机制不同，vue 的监听方式`vue.$on('event-name', handler)` 已替调用者自动绑定正确的 `this`，无需手动绑定或者使用 arrow function。这一点比 React 好。React 的绑定 `this` 有四五种方式，下次有机会可写一写。
3. Vue 模板中的事件也自动绑定了 `this`。

完整代码见 [feature/bus 分支](https://github.com/legend80s/sites-vue/tree/feature/bus)

## 参考

1. [VueJS Grandchild component call function in Great grandparent component](https://stackoverflow.com/questions/43254812/vuejs-grandchild-component-call-function-in-great-grandparent-component/43257152)

