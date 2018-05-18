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
import Vue from 'vue';
import {
  mapState,
} from 'vuex';

import debounce from 'lodash.debounce';
import {
  Input,
  Button,
  Form,
} from 'element-ui';

import SuggestionList from './SuggestionList';
import {
  SET_QUERY,

  FETCH_SUGGESTIONS,
} from '../store/mutation-types';

Vue.use(Input);
Vue.use(Button);
Vue.use(Form);


export default {
  name: 'SearchBox',

  components: {
    SuggestionList,
  },

  computed: {
    query: {
      get() {
        return this.$store.state.query;
      },
      set(query) {
        this.$store.commit(SET_QUERY, { query });
      },
    },

    ...mapState([
      'suggestions',
    ]),

    // suggestions() {
    //   return this.$store.state.suggestions;
    // },
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
