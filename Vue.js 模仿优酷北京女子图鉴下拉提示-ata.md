*可关注微信公众号“JavaScript与编程艺术”*

## 前言

**Vue is Awesome!**

> *Angular.js 明显有坑，React 没有明显的坑，Vue.js 明显没有坑*

![北京女子图鉴](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-1.png)

## 准备工作

### 一、确定需求

**需求：** 实现类似优酷的搜索下拉提示效果，具体要求：

1. 输入文字展现相应下拉提示结果
2. 高亮匹配的查询词
3. 点击下拉提示结果自动替换到输入框（优酷的效果是点击后直接搜索）
4. 前三条下拉提示序号标红凸显为热词
5. 点击搜索“🔍”图标搜索查询词
6. 初始化时即未输入任何字符显示十条热搜

**优酷效果图：**

![北京女子图鉴-优酷](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-%E4%BC%98%E9%85%B7-home.png)

**我的效果图：**

![我的下拉提示效果图-带 vue logo](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-my-vue-logo.png)

### 二、项目初始化

```shell
1. cd ~/workspace/learning/programming/js/framework # 进入你的工作目录
2. npm install vue-cli -g
3. vue init webpack sites
4. cd sites
5. npm run dev
```

然后找到入口文件，一般是 `src/App.vue`。如果你要问为什么？打开 package.json 找到 `npm run dev` 发现 `webpack.dev.conf.js`，但没有 `entry`，然后看到 `merge(baseWebpackConfig...`，则一定在 `baseWebpackConfig` 中，打开对应的配置文件 `webpack.base.conf`，发现 `entry: { app: './src/main.js' },`然后即可定位到 `App.vue`。

打开 `App.vue` 发现没有语法高亮，`cmd + shift +p` 安装 `Vue Syntax Highlight`。若被墙无法安装，请自行搜索解决。安装完毕重新打开该文件，即可发现已有语法高亮。

### 三、选择 UI 库

对比 vue-material、vuetify 和 element-ui 的下载数，以及各自的组件样式，最终选择我喜欢的 element-ui。

### 四、模块化设计

现代 UI 框架均提倡组件化开发模式，所以我们一开始就按模块设计是一个好的习惯。按照 Vue 的说法所有的应用均可类似一棵嵌套的组件树的形式来组织。

![vue nested component tree](https://raw.githubusercontent.com/legend80s/statics/master/vue-components.png)

<center>*一棵嵌套的组件树*</center>

组件从大到小，`>` 表示包含关系，`{0, n}` 代表 0 到 n 个：

- SearchBox > Input + Button + SuggestionList
- SuggestionList > SuggestionItem {0, 10}

```shell
                    SearchBox
+------------------------------------------------+
|                                                |
|   +----------------------------------------+   |
|   |            Input         ||    Button  |   |
|   +----------------------------------------+   |
|   +----------------------------------------+   |
|   | |------------------------------------| | +----> SuggestionList
|   | |------------------------------------| |   |
|   | |------------------------------------| |   |
|   | |----------------------------------------------->SuggestionItem
|   | |------------------------------------| |   |
|   | |------------------------------------| |   |
|   +----------------------------------------+   |
|                                                |
+------------------------------------------------+
```

## 开始编程

首先引入 element-ui 样式和我们即将写的第一个组件 `SearchBox`。注意我们并没有引入所有的 element-ui 组件，因为“按需加载”才是最佳实践，我们将在用到的地方才会加载。

Vue 的组件包含以下属性：

1. `name`：组件名。必须
2. `components`：嵌套组件。如果有
3. `data`：状态。**必须是一个函数**，因为每个实例必须维护一份独立拷贝。类比于 React 的 `state`，每次必须返回一个全新的 `state`
4. `methods`：方法。类似 React 的 `actions`
5. `props`：属性。父组件通过 `prop` 向子组件传递数据。必须，因为这是最佳实践
6. `template`：内联模板。即试图（view），提倡用组件的 `<template></template>`
7. 生命周期钩子：hook。比如 `created`、`mounted`，具体见参考链接“Vue.js 生命周期钩子”，我们通常在 `created` 中初始化异步资源，为什么不在 `mounted`中初始化资源，因为 `created`先于 `mounted` 且服务器端没有 `mounted`（见参考链接 [Difference between the created and mounted events in Vue.js](https://stackoverflow.com/questions/45813347/difference-between-the-created-and-mounted-events-in-vue-js)）。`mounted` 可类比于 React 的 `componentDidMount`，虽然 React 推荐在 `componentDidMount` 中初始化资源。

修改入口文件：

```javascript
// src/App.vue
import 'element-ui/lib/theme-chalk/index.css';
import SearchBox from './components/SearchBox';

export default {
  name: 'App',
  components: {
    SearchBox,
  },
};
```

### 一、静态页面

开始我们的第一个组件 `SearchBox`，它包含 `input`，`button` 和自定义组件 `SuggestionList`。该组件用到了 `el-form`、`el-input`和 `el-button`，所以我们只需加载这三个基础组件，加载和使用方法见参考链接“[element-ui 快速上手](http://element.eleme.io/#/zh-CN/component/quickstart)”。

```vue
<!-- src/components/SearchBox.vue -->
<template>
  <el-form @submit.native.prevent="search" class="search-box">
    <el-input
      type="text"
      placeholder="请输入内容"
      clearable
      required
      v-model.trim="query"
      v-on:input="fetchSuggestions"
    >
      <el-button
        type="primary"
        slot="append"
        v-on:click="search"
      >
        搜索
      </el-button>
    </el-input>

    <SuggestionList
      v-if="suggestions.length > 0"
      v-bind:suggestions="suggestions"
    />
  </el-form>
</template>

<script>
import Vue from 'vue';
import {
  Input,
  Button,
  Form,
} from 'element-ui';
import SuggestionList from './SuggestionList';

Vue.use(Input);
Vue.use(Button);
Vue.use(Form);

export default {
  name: 'SearchBox',

  components: {
    SuggestionList,
  },

  data() {
    return {
      query: '',
      suggestions: [],
    };
  },

  methods: {
    search() {},
    fetchSuggestions() {},
  },
};
</script>
```

下面完成 `SuggestionList` 组件，它包含 `SuggestionItem`。**注意 `v-for` 元素必须提供唯一的 `key`。**

```vue
<!-- src/components/SuggestionList.vue -->
<template>
  <div class="suggestion-list-wrapper">
    <ol>
      <SuggestionItem
        v-for="(suggestion, index) in suggestions"
        v-bind:key="index"
        v-bind:suggestion="suggestion"
      ></SuggestionItem>
    </ol>
  </div>
</template>

<script>
import SuggestionItem from './SuggestionItem';

export default {
  name: 'SuggestionList',

  props: {
    suggestions: {
      type: Array,
      required: true,
    },
  },

  components: {
    SuggestionItem,
  },
};
</script>
```

接下来完成 `SuggestionItem` 组件，其功能是展示一条下拉提示以及它的序号。加 `validator` 的目的是确保 `suggestion` 必须包含 `value`和 `index` 属性。`validator` 返回 `true` 则验证通过，否则会在控制台打印错误信息。

```vue
<!-- src/components/SuggestionItem.vue -->
<template>
  <li>
    {{ suggestion.index }}. {{ suggestion.value }}
  </li>
</template>

<script>
export default {
  name: 'SuggestionItem',

  props: {
    suggestion: {
      type: Object,
      required: true,

      validator(self) {
        return 'value' in self && 'index' in self;
      },
    },
  },
};
</script>
```

静态页面基本完成，接下来完成主功能。

### 二、输入文字展现相应下拉提示结果

首先我们从优酷的主页“盗取”其下拉提示 API，尝试几次后发现用 `window.fetch` 会报跨域错误，故只能用 jsonp 来获取数据，从 `awesome-vue` 搜索到 jsonp 工具 `vue-jsonp`。`SearchBox` 组件利用其发起请求，并利用 lodash 的 `debounce` 防止频繁输入引发多余的无用请求。

```vue
<!-- src/components/SearchBox.vue -->
<template>
  <el-form @submit.native.prevent="search" class="search-box">
    <el-input
      type="text"
      placeholder="请输入内容"
      clearable
      required
      v-model.trim="query"
      v-on:input="debouncedFetchSuggestions"
    >
      <el-button
        type="primary"
        slot="append"
        v-on:click="search"
      >
        搜索
      </el-button>
    </el-input>

    <SuggestionList
      v-if="suggestions.length > 0"
      v-bind:suggestions="suggestions"
    />
  </el-form>
</template>

<script>
/* eslint-disable no-console */
import debounce from 'lodash.debounce';
import VueJsonp from 'vue-jsonp';

Vue.use(VueJsonp);

export default {
  methods: {
    fetchSuggestions() {
      this.$jsonp('http://tip.soku.com/search_tip_1?site=2', {
        query: this.query,
        callbackQuery: 'jsoncallback',
      })
        .then(json => json.r.map(({ w }, index) => ({ value: w, index })))
        .then((suggestions) => {
          console.log('suggestions:', suggestions);
          this.suggestions = suggestions;
        })
      ;
    },

    debouncedFetchSuggestions: debounce(function _() { this.fetchSuggestions(); }, 500),
  },
};
</script>
```

至此“输入文字展现相应下拉提示结果”功能已经完成。下面完成”高亮显示匹配的查询词“。

### 三、高亮显示匹配的查询词

为完成该需求 `SuggesitionItem` 组件须知道输入的 query，所以关键点是如何将 `SearchBox`（爷爷）的属性传递给 `SuggesitionItem`（孙子）。

**组件间通信：** Vue 规定数据只能从上往下单向流动，所以我们应该将 `query` 当做组件的属性一一传递下去。利用`v-bind:query`指令即可。

**v-html：** 因为高亮必须插入 html 标签，所以必须利用 `v-html` 指令。注意只有你信任的内容才可以用该指令，因为有可能导致 xss 攻击，否则请直接用插值 `{{}}` 表达式，其他注意事项见参考文献”v-html“。

**computed：** 计算属性，参考链接 [计算属性](https://cn.vuejs.org/v2/guide/computed.html#%E8%AE%A1%E7%AE%97%E5%B1%9E%E6%80%A7)。当一个变量依赖另一个变量时可将其定义为计算属性，好处是：

1. 易读。
2. 复用性好。尤其当在模板中多次引用该变量时。
3. 易维护。在模板中放入太多的逻辑会让模板过重且难以维护，对于任何复杂逻辑，你都应当使用**计算属性**。
4. 缓存。基于其依赖进行缓存，计算属性可以用 method 代替但却失去了缓存效果
5. 避免滥用 `watch`。`watch` 是命令式的而且 ***MAGIC, DIRTY, UNPREDICTABLE, UNCONTROLLABLE THUS EVIL***。该函数类似于 Angular.js ”臭名昭著“的同名函数。当然也有其使用场景，详情请参考 [计算属性-vs-侦听属性](https://cn.vuejs.org/v2/guide/computed.html#%E8%AE%A1%E7%AE%97%E5%B1%9E%E6%80%A7-vs-%E4%BE%A6%E5%90%AC%E5%B1%9E%E6%80%A7)

```vue
<!-- src/components/SearchBox.vue -->
<SuggestionList
  v-if="suggestions.length > 0"
  v-bind:suggestions="suggestions"
  v-bind:query="query"
/>

<!-- src/components/SuggestionList.vue -->
<SuggestionItem
  v-for="(suggestion, index) in suggestions"
  v-bind:key="index"
  v-bind:suggestion="suggestion"
  v-bind:query="query"
></SuggestionItem>

<!-- src/components/SuggestionItem.vue -->
<template>
  <li>
    <span v-html="hilighted"></span>
  </li>
</template>

<script>
// ...
export default {
  // ...
  props: {
    query: {
      type: String,
      required: true,
    },
  },

  computed: {
    /**
     * 返回高亮（加粗）后的下拉提示
     * @return {string}
     */
    hilighted() {
      const boldQuerySegement = this.suggestion.value
      	.replace(this.query, matched => `<b>${matched}</b>`);

      return boldQuerySegement;
    },
  },
};
</script>
```

### 四、点击下拉提示结果自动替换到输入框

该功能难点在于孙子组件需改变其祖先组件的属性。改变父组件我们可通过子组件触发自定义事件 `$emit('event-name'[, ...payloads])` 父组件监听的方式来实现。但无法跨层监听，即祖先组件无法监听到孙子组件触发的事件，因为 Vue 的事件不支持“冒泡”。

#### 跨组件通信

Vue 为什么不允许跨组件通信，是为了解耦，祖先祖先无需也不应该知道孙子组件的存在

经过调研有三种方法：

1. Vuex。用 Vuex 来集中管理组件状态，类似 Redux。缺点“高射炮打蚊子——大材小用”。但下一篇文章为演示 Vuex 的用法，我会使用该方法。代码见：todo
2. databus。用数据总线的方式，祖先元素定义 bus 并监听 bus 触发的事件，父组件将 bus 当做属性传递下去，孙子组件触发事件。因为该 bus 是祖先元素定义的，所以自然可以被其监听到。具体见参考链接“VueJS Grandchild component call function in Great grandparent component”。代码见：todo
3. `$emit`。还用 `$emit`，只是改为一层层往上传递，模拟原生事件的“冒泡”机制。代码见：[version1 分支](https://github.com/legend80s/sites-vue/tree/feature/version1)

 本文采用方法 3。

```vue
<!-- src/components/SuggestionItem.vue -->
<!-- 孙子组件触发事件 -->
<template>
  <li
    v-on:click="handleClick(suggestion)"
  >
    <span v-bind:class="{ top3: suggestion.index < 3 }">{{ suggestion.index + 1 }}. </span>
    <span v-html="hilighted"></span>
  </li>
</template>

<script>
export default {
  name: 'SuggestionItem',
  methods: {
    handleClick({ value }) {
      // 将事件往上“冒泡”
      this.$emit('item-click', value);
    },
  },
};
</script>
```

```vue
<!-- src/components/SuggestionList.vue -->
<!-- 父组件负责向上传递事件 -->
<template>
  <SuggestionItem
    v-for="(suggestion, index) in suggestions"
    v-bind:key="index"
    v-bind:suggestion="suggestion"
    v-on:item-click="handleItemClick"
    v-bind:query="query"
  ></SuggestionItem>
</template>

<script>
/* eslint-disable no-console */
export default {
  name: 'SuggestionList',
  methods: {
    handleItemClick(query) {
      console.log('reset query to in suggestion-list:', query);
      // 将事件继续往上“冒泡”
      this.$emit('set-query', query);
    },
  },
};
</script>
```

```vue
<!-- src/components/SearchBox.vue -->
<!-- 祖先组件监听来自父组件的事件 -->
<template>
  <SuggestionList
    v-if="suggestions.length > 0"
    v-bind:suggestions="suggestions"
    v-on:set-query="handleSetQuery"
    v-bind:query="query"
  />
</template>

<script>
/* eslint-disable no-console */
export default {
  name: 'SearchBox',
  methods: {
    handleSetQuery(query) {
      console.log('reset query to in SearchBox:', query);
      this.query = query;
    },
  },
};
</script>
```

### 五、前三条下拉提示序号标红凸显为热词

利用 `v-bind:class`，如果 `index` 为 0 1 2 则 `class` 添加 `top3`。该指令和 Angular.js 的 `ng-class` 完全一样。

```vue
<!-- src/components/SuggestionItem.vue -->
<template>
  <li
    v-on:click="handleClick(suggestion)"
  >
    <span v-bind:class="{ top3: suggestion.index < 3 }">{{ suggestion.index + 1 }}. </span>
    <span v-html="hilighted"></span>
  </li>
</template>

<script>
// ...
</script>

<style scoped lang="less">
li {
  // ...
  .top3 {
    color: #f60;
  }
}
</style>
```

完成最后两个需求。

###六、点击搜索及初始化显示十条热搜

可利用 `created` 钩子初始化异步资源。小提示：`window.open` 参数可以不 `encodeURIComponent`，因为浏览器会帮我们做。

```vue
<!-- src/components/SearchBox.vue -->
<script>
export default {
  name: 'SearchBox',

  created() {
    this.fetchSuggestions();
  },

  methods: {
    search() {
      window.open(`http://www.soku.com/search_video/q_${window.encodeURIComponent(this.query)}`);
    },
  },
};
</script>
```

## 最终效果

代码见：[version1 分支](https://github.com/legend80s/sites-vue/tree/feature/version1)，最终效果如下：

![我的效果图之初始化时显示十条热搜](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-initial.png)

<center>*初始化时显示十条热搜*</center>

![输入“北京女子”展现相应的下拉提示结果](https://raw.githubusercontent.com/legend80s/statics/master/%E5%8C%97%E4%BA%AC%E5%A5%B3%E5%AD%90%E5%9B%BE%E9%89%B4-my-brief.png)

<center>*输入“北京女子”展现相应的下拉提示结果*</center>

## 最佳实践

1. `v-for` 需配合 `v-bind:key`
2. 计算属性应该用名词或形容词命名，虽然它的表现形式是方法，但其实是属性
3. 属性描述很重要，越详细友好，因为可有效避免和排查问题

## 友情 Tips

1. 若组件中引入了 “less”`<style lang="less">`，请安装相应 loader `npm install less-loader less`
2. 将 Sublime Text 3 链接为全局命令并在 terminal 中使用：`ln -s "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl" /usr/local/bin/edit`。试试 `edit .` 用 sublime 打开当前目录
3. 为什么语法高亮我会选择“Vue Syntax Highlight”，秉承“一切参照文档”精神，可在官方文档“awesome-vue” 找到，其他编辑器设置也可见参考“awesome-vue”
4. 若发现有重复代码模板，可新建 snippet，设置`Ctl + D` 为创建 snippet 的快捷键：`{ "keys": ["ctrl+d"], "command": "new_snippet" }`
5. 开发阶段需加必要的 log 用来调试，但是 eslint 会显示烦人的 warning，可用 `/* eslint-disable no-console */` 抑制它
6. 看 Vue 的文档发现一个有趣的 API：https://yesno.wtf/api

## 开发体验

### 好的

1. 有 Vue 特定的 eslint。可极大避免不符合 Vue 规范的写法，比如 `computed` 的函数属性如果没有返回值会提示
2. 编译失败，terminal 会有 alert bell 且页面会有涂层显示错误信息，类似 React

### 差的

1. 编译报错之后 `Unhandled rejection Error: Cannot find module 'jade'`，改对后不会触发重新编译。有可能是 webpack 的原因
2. 中文文档有不准确的链接。比如 “props 定义属性” 没有中文文档，英文文档见 https://vuejs.org/v2/guide/components-props.html#Prop-Validation
3. 报错信息不友好，比如`validator` 报错并没有指定到哪一行

## 疑惑

### 单文件组件

为什么一个组件文件包含所有的 template、script、style？而不是像 angular 或 React 拆分为多个文件？

官方解释：带来的好处是有 [完整语法高亮](https://github.com/vuejs/awesome-vue#source-code-editing)、[CommonJS 模块](https://webpack.js.org/concepts/modules/#what-is-a-webpack-module)、[组件作用域的 CSS](https://vue-loader.vuejs.org/zh-cn/features/scoped-css.html)，其实就是可以利用 vue-loader 的预处理能力，然后还提到了[怎么看待关注点分离？](https://cn.vuejs.org/v2/guide/single-file-components.html#%E6%80%8E%E4%B9%88%E7%9C%8B%E5%BE%85%E5%85%B3%E6%B3%A8%E7%82%B9%E5%88%86%E7%A6%BB%EF%BC%9F)，但我并不太同意其看法，官方最后提出一种“妥协”方法：

> 即便你不喜欢单文件组件，你仍然可以把 JavaScript、CSS 分离成独立的文件然后做到热重载和预编译。
>
> ```html
> <!-- my-component.vue -->
> <template>
>   <div>This will be pre-compiled</div>
> </template>
> <script src="./my-component.js"></script>
> <style src="./my-component.css"></style>
> ```

我理解的好处是修改集中。比如有三个组件，如果非单文件组件，得同时打开 6 个 tab，切换极其不方便。

古人云“入境而问禁，入国而问俗，入门而问讳”，所以我的结论是即便不赞同但“入乡随俗”，仍使用一个文件的写法。

## 总结

总的来说 Vue.js 开发体验很好很顺畅，对于从事过 Angular.js 的开发者很友好。

**Vue is Awesome!**

> *Angular.js 明显有坑，React 没有明显的坑，Vue.js 明显没有坑*

![vue-logo-96x96](https://raw.githubusercontent.com/legend80s/statics/master/vue-logo-96x96.png)

## 参考

1. awesome-vue：https://github.com/vuejs/awesome-vue#sublime-text
2. 单文件组件：https://cn.vuejs.org/v2/guide/single-file-components.html
3. v-html：https://cn.vuejs.org/v2/api/#v-html
4. 计算属性：https://cn.vuejs.org/v2/guide/computed.html#%E8%AE%A1%E7%AE%97%E5%B1%9E%E6%80%A7
5. 计算属性-vs-侦听属性：https://cn.vuejs.org/v2/guide/computed.html#%E8%AE%A1%E7%AE%97%E5%B1%9E%E6%80%A7-vs-%E4%BE%A6%E5%90%AC%E5%B1%9E%E6%80%A7
6. 属性校验：https://vuejs.org/v2/guide/components-props.html#Prop-Validation
7. Vue.js 生命周期钩子：https://cn.vuejs.org/v2/api/#%E9%80%89%E9%A1%B9-%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E9%92%A9%E5%AD%90
8. element-ui 快速上手：http://element.eleme.io/#/zh-CN/component/quickstart
9. VueJS Grandchild component call function in Great grandparent component：https://stackoverflow.com/questions/43254812/vuejs-grandchild-component-call-function-in-great-grandparent-component/43257152
10. Difference between the created and mounted events in Vue.js：https://stackoverflow.com/questions/45813347/difference-between-the-created-and-mounted-events-in-vue-js
11. ASCII 码画图工具：http://asciiflow.com/
12. Launch Sublime Text 2 or 3 from the Mac OSX Terminal：https://ashleynolan.co.uk/blog/launching-sublime-from-the-terminal
