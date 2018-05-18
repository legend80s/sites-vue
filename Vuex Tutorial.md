## 前言

> **Vue is Awesome! So is Vuex! But not its docs 😓.**

image

本文是继 *“[Vue.js 模仿优酷北京女子图鉴下拉提示](https://mp.weixin.qq.com/s/_NIzlkBngFtOw0NXA307NQ)”* 的后续篇，采用 Vuex 重构。此文目的：

> 一、旨在学习 Vuex；
>
> 二、给初学者提供一个深入浅出易读的 Vuex 实践篇。

Vuex 的文档远没有 Vue 好，很零碎，看完之后仍然如堕云里不知所述。本文参照国内外很多文章，其中对我启发较大的是 https://scotch.io/tutorials/state-management-in-vue-getting-started-with-vue，该文较结构清晰叙述简洁，但同时解释的稍稍少了点。

故成此文，望对如我一般最初“畏惧” Vuex 等一切状态管理框架的初学者们有所帮助，若还能够带领大家拨开状态管理的迷雾，如此这般善莫大焉！也希望对学习 Redux 的朋友有少许启发，有机会再写一篇 Redux 文。

## 什么是 Vuex？

Vuex 是一个状态集中管理框架，每一次状态改变都是可预测的。原文如下：

> Vuex is a **state management pattern + library** for Vue.js applications. It serves as a centralized store for all the components in an application, with rules ensuring that the state can only be mutated in a predictable fashion.

逐词剖析如下：

1. 什么是状态？
   - 一切引起 view 变化的数据都是状态，比如 `data`、`computed` 中的数据。
2. 何谓“集中”？
   - 因为由 `store` 集中管理所有的状态，所以称之“集中”。
3. 为什么叫“框架”？
   - 必须按照特定模式去编程，此所谓框架也。
4. 为什么以及如何实现“可预测”？
   1. Why：方便定位问题。可预测的代码一旦肇事可“时光逆转”到事发现场，或者说恢复事发现场，高大上则谓之“时光旅行 Time Travelling”。*期待下篇的“时光旅行”吧！*
   2. HOW：如何实现“可预测”，严格模式下 Vuex 的每一次状态改变都必须通过 `commit` 或 `dispatch` 来执行，以此保证状态的“可预测”。但开启严格模式，会有性能问题（deep watch），所以一般线上关闭该特性。


## 何故引入 Vuex？

如果你没有经历过一个属性被诸多毫无关系的组件读取或设置，或没有面临过嵌套组件 `props` 传递过深如“铁锁连环船 ”般，然后发出“一入侯门深似海”的哀叹时，你就无需 `Vuex`。否则 Vuex 可救你于复杂组件通信的水深火热之中。

## 如何使用 Vuex？

先看看 Vuex `store` 的写法。*注意定义 `store` 之前必须 `Vue.use(Vuex);`，否则会报错*。

```javascript
// store/index.js

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
  },
  actions: {
  },
  mutations: {
  },
  getters: {
  },  
  modules: {
  }
});

export default store;
```

以及目录结构

```shell
├── index.html
├── main.js
├── api
│   └── ... # 抽取出API请求
├── components
│   ├── App.vue
│   └── ...
└── store
    ├── index.js # 我们组装模块并导出 store 的地方
    ├── actions.js # 根级别的 action
    ├── mutations.js # 根级别的 mutation
    └── modules
        ├── cart.js # 购物车模块
        └── products.js # 产品模块
```

回顾下我们的需求

> 实现类似优酷的搜索下拉提示效果：
>
> 1. 输入文字展现相应下拉提示结果
> 2. 高亮匹配的查询词
> 3. 点击下拉提示结果自动替换到输入框（优酷的效果是点击后直接搜索）
> 4. 前三条下拉提示序号标红凸显为热词
> 5. 点击搜索“🔍”图标搜索查询词
> 6. 初始化时即未输入任何字符显示十条热搜

### 一、定义 `state`

组件间通用的数据方可定义为 `state`，否则应该当做组件的私有属性，输入的查询关键词被多个组件使用，因此可将其作为 `state`。下拉提示结果因为只是 `SuggestionList` 使用（`SuggestionItem` 属于其且无法单独使用），因此建议将其作为 local state，但本文为介绍 `dispatch` 异步获取资源的用法，故也将其归入 `state`。

最终 ` state` 定义如下：

```javascript
// store/index.js

state: {
  query: '',
  suggestions: [],
},
```

### 二、定义 `mutations`

`mutation` 是我们唯一改变状态的途径，没有之一，其改变是同步的。本文会改变 `query` 和 `suggestions`，故 `mutations` 定义为：

```javascript
// store/index.js

import {
  SET_QUERY,
  SET_SUGGESTIONS,
} from './mutation-types';

// ...
mutations: {
  [SET_QUERY](state, { query }) {
    state.query = query;
  },

  [SET_SUGGESTIONS](state, { suggestions }) {
    state.suggestions = suggestions;
  },
},
  
// ./mutation-types.js

// mutations
export const SET_QUERY = 'SET_QUERY';
export const SET_SUGGESTIONS = 'SET_SUGGESTIONS';
```

其中函数名写成 `[SET_QUERY]` 而不是 `setQuery` 原因在于：

1. 在别处使用该函数时无需记住其名，只需从常量文件导出即可，避免写错名字的尴尬；

2. 集中管理 `mutation` 的种类。


当然你也可以不遵循该规则，不过学过 React 的同学应该很熟悉会不由自主遵循。

 ### 三、定义 `actions`

凡涉及异步请求的操作均需被定义为 `action`，但 `action` 并非一定是异步请求。`action` under the hood 其实也是调用已存在的 `mutation`。本文唯一一个异步请求即获取下拉提示。

因为 `action` 是异步的，因此不可避免涉及几个问题。

1. 如何知道一个 `action` 何时结束？
2. 如何控制多个 `action` 的异步流，即如何级联或者并行执行 `actions`？

首先你要明白，若 `action` 返回 `Promise`，则 `dispatch` 返回值也是 `Promise`，因此上面的问题迎刃而解。**最佳实践：让 `action` 返回 `Promise` **。详见“组合 Action https://vuex.vuejs.org/zh-cn/actions.html”。

在 `action` 中获取到下拉提示后，需 `commit` 而不能手动设置 `state`。`commit` 函数签名为 `store.commit('MUTATON_NAME', payload)` 或 `store.commit({ type: 'MUTATON_NAME', amount: 10 })`，其中 `payload` 通常是一个字面量对象。所以设置下拉提示状态应该写成 `context.commit(SET_SUGGESTIONS, { suggestions })`。注意此处的 `context` 和 `store` 有区别。

```javascript
// store/index.js

import Vue from 'vue';
import VueJsonp from 'vue-jsonp';
import {
	// ...
  FETCH_SUGGESTIONS,
} from './mutation-types';

Vue.use(VueJsonp);

// ...
actions: {
  [FETCH_SUGGESTIONS](context) {
    return Vue.jsonp('http://tip.soku.com/search_tip_1?site=2', {
      query: context.state.query,
      callbackQuery: 'jsoncallback',
    })
      .then(json => json.r.map(({ w }, index) => ({ value: w, index })))
      .then(suggestions => context.commit(SET_SUGGESTIONS, { suggestions }))
    ;
  },
},
  
// ./mutation-types.js
  
// mutations
// ...

// actions
export const FETCH_SUGGESTIONS = 'FETCH_SUGGESTIONS';
```

同样将获取下拉提示的函数名用常量 `FETCH_SUGGESTIONS` 替代。

### 四、 注入 `store`

在入口文件中将 `store` 传入 `Vue` 中，以便所有的组件都能引用该 `store`。

```javascript
// main.js

// ...
import store from './store';

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  components: { App },
  template: '<App/>',
});
```

### 五、使用 `store`

在组件中通过 `this.$store` 可以获取到刚刚注入的 `store`。现在 `query` 和 `suggestions` 都改为计算属性并从 `store` 中取，比如获取 `query`：`this.$store.state.query`。

页面初始化时需展现默认下拉提示，所以在 `created` 中，我们执行 `this.$store.dispatch(FETCH_SUGGESTIONS)`，该操作会触发 `store` 中 `FETCH_SUGGESTIONS` 方法。`dispatch` 方法同样有两种签名。但因为在获取下拉提示的 `action` 方法中，我们能够获取到 `query`，因此无需使用带 `payload` 的方式。

```javascript
// components/SearchBox.vue

import {
  SET_QUERY,
  FETCH_SUGGESTIONS,
} from '../store/mutation-types';

export default {
  computed: {
    query() {
      return this.$store.state.query;
    },
    suggestions() {
      return this.$store.state.suggestions;
    },
  },

  created() {
    this.$store.dispatch(FETCH_SUGGESTIONS);
  },
  
  methods: {
    search() {
        window.open(`http://www.soku.com/search_video/q_${this.query}`);
    },
    debouncedFetchSuggestions: debounce(function fetchSuggestions() {
      this.$store.dispatch(FETCH_SUGGESTIONS);
    }, 500),
  },
};
```

以上代码在输入查询词时会有一个报警。

> Computed property "query" was assigned to but it has no setter.

因为 `query` 被 `v-model` 绑定，用户输入时 Vue 会试图直接修改 `query`，而在严格模式中，所有的状态修改必须通过 `mutation` 执行，所以会抛错，有两种解法：
**解法一：**

绑定 `value` 并在 `input` 事件中通过 `commit` 来更新该值。

```vue
<!-- components/SearchBox.vue -->

<input :value="query" @input="updateQuery">

<script>
// ...
methods: {
  updateQuery(e) {
    this.$store.commit(SET_QUERY, e.target.value)
  }
}
</script>
```

**解法二：**

仍利用 `v-model` 的双向绑定便利性，但是给 `query` 添加 `getter / setter` 方法，在 `setter` 中 `commit`。

该方法较一简单多了而且也保留了 `v-model` 的很多有用的特性。比如修饰符 `trim` 等。

```javascript
// components/SearchBox.vue

computed: {
  query: {
    get() {
      return this.$store.state.query;
    },
    set(query) {
      this.$store.commit(SET_QUERY, { query });
    },
  },

  // ...
}
```

`SuggestionItem` 也需要获取 `query`，故将其定义为 `computed` 并从 `store` 中取。点击下拉提示替换 `query` 功能可通过 `commit` 一个 `SET_QUERY` mutation 完成。
假如我们想实现点击下拉提示的同时发起一个针对该下拉提示的请求，直接 `dispatch` 一个 `FETCH_SUGGESTIONS` 即可，如此的简单！*Awesome, isn't it?*

```javascript
// components/SuggestionItem.vue

computed: {
  query() {
    return this.$store.state.query;
  },
}

methods: {
  handleClick({ value }) {
    this.$store.commit(SET_QUERY, { query: value });
    
    // 发送请求如此简单
    this.$store.dispatch(FETCH_SUGGESTIONS);
  },
},
```

至此用 Vuex 重构的目标已经完成，还可利用 Vuex 的工具函数 `mapState` 做一点代码简化。是否简化看个人喜好或遵循团队规范。

其他工具函数包括：`mapGetters`、`mapMutations`、`mapActions`。

小疑惑：为什么是 `mapState` 而非 `mapStates`？是为了和 `state` 呼应，那为什么不用 `states`？`state` 作为名词是可数的呀，我推测可能是为了和 React 保持一致。

```javascript
import {
  mapState,
  mapGetters,
  mapMutations,
  mapActions,
} from 'vuex';
  
// 一个例子🌰而已
computed: {
  query() {
  	return this.$store.state.query;
	},
  suggestions() {
  	return this.$store.state.suggestions;
	},
  
  value() {
    return this.$store.getters.value;
  },
},
  
methods: {
  increment() {
    this.$store.commit('increment', { augment: 2 })
  },
  fetchSuggesions() {
    this.$store.dispatch('fetchSuggesions')
  },
}

// 可简化为
computed: {
  ...mapState([
    'query',
    'suggestions',
  ]),
    
  ...mapGetters([ 'value' ]),
},
  
methods: {
  ...mapMutations([ 'increment' ]),
  ...mapActions([ 'fetchSuggesions' ]),
}
```

## 总结

> **Vue is Predictable and Performant thus Awesome!**

一张图总结：

![vuex](/Users/chuanzong.lcz/Downloads/images/wechat/公众号/vuex/vuex.png)

请顺时针看图说话：用户触发操作发起请求，对应 `dispatch` 一个 `action`，请求结束，`commit` 一个 `mutation` 去触发状态改变，devtool 拦截每一次 `mutation`，方便 debug，状态改变触发 view 变化，使得引用该状态的所有组件得到高效更新。*绿色的虚线框代表 Vuex 的统治疆域：所有的状态改变。*

**Predictable, Performant and Cool, isn't it!**

Vuex 带来的好处：

1. 分层明确，结构清晰。数据和对数据的操作与 View 隔离。
2. 可预测的状态管理。方便 debug。
3. 集中、统一的状态改变方式。DRY 原则，防止重复逻辑散落，导致复制粘贴。
4. 优雅的组件通信解决方案。优势尤其凸显在当需要在 sibling 组件间通信时。
5. 高效。高效对比然后结合虚拟 DOM 按需更新。

从这几点来看，即使是小型应用，引入 Vuex 也颇有益处。

代码见：vuex 分支 https://github.com/legend80s/sites-vue/tree/feature/vuex

## 参考

1. 目录结构 https://vuex.vuejs.org/zh-cn/structure.html
2. 表单处理 https://vuex.vuejs.org/zh-cn/forms.html
3. 组合 Action https://vuex.vuejs.org/zh-cn/actions.html
4. State Management in Vue: Getting Started with Vuex https://scotch.io/tutorials/state-management-in-vue-getting-started-with-vue
5. Vue + Vuex — Getting started https://medium.com/wdstack/vue-vuex-getting-started-f78c03d9f65
6. Intro to Vue.js: Vuex https://css-tricks.com/intro-to-vue-4-vuex