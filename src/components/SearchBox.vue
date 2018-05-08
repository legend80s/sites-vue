<template>
  <el-form @submit.native.prevent="search" class="search-box">
    <el-input
      type="text"
      placeholder="请输入内容"
      clearable
      required
      v-model.trim="query"
      @input="debouncedFetchSuggestions"
    >
      <el-button
        type="primary"
        slot="append"
        @click="search"
      >
        搜索
      </el-button>
    </el-input>

    <SuggestionList
      v-if="suggestions.length > 0"

      :suggestions="suggestions"
      :query="query"

      :bus="bus"
    />
  </el-form>
</template>

<script>
/* eslint-disable no-console */
import Vue from 'vue';
import debounce from 'lodash.debounce';
import VueJsonp from 'vue-jsonp';

import {
  Input,
  Button,
  Form,
} from 'element-ui';

import SuggestionList from './SuggestionList';


Vue.use(Input);
Vue.use(Button);
Vue.use(Form);

Vue.use(VueJsonp);


export default {
  name: 'SearchBox',

  components: {
    SuggestionList,
  },

  data() {
    return {
      query: '',
      suggestions: [],

      // 监听孙子组件的事件
      // a global event bus can be passed down through the props chain
      // 该方式更加简洁，中间组件无需往上传递事件，只需将 `bus` 往下传即可
      bus: new Vue(),
    };
  },

  created() {
    this.fetchSuggestions();
    this.bus.$on('set-query', this.handleSetQuery);
  },

  methods: {
    search() {
      window.open(`http://www.soku.com/search_video/q_${window.encodeURIComponent(this.query)}`);
    },

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

    handleSetQuery(query) {
      console.log('reset query to in SearchBox:', query);
      this.query = query;
    },
  },
};

</script>

<style lang="less" scoped>
.search-box {
  width: 50%;
  margin: auto;
}
</style>

<!-- 不能加 scoped，否则无法给 el-input-group__append 添加样式，还未找到更好的解决方法 -->
<!-- 放到另一个 style 之内，将“脏”代码和“干净”代码隔离开 -->
<style lang="less">
.search-box {
  .el-input-group__append {
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
  }
}
</style>
