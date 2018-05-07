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
      v-on:set-query="handleSetQuery"
      v-bind:query="query"
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
    };
  },

  created() {
    this.fetchSuggestions();
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
