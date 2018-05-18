<template>
  <li
    v-on:click="handleClick(suggestion)"
  >
    <span v-bind:class="{ top3: suggestion.index < 3 }">{{ suggestion.index + 1 }}. </span>
    <span v-html="hilighted"></span>
  </li>
</template>

<script>
import {
  mapState,
} from 'vuex';

import {
  SET_QUERY,

  FETCH_SUGGESTIONS,
} from '../store/mutation-types';

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

  computed: {
    /**
     * 返回加粗后的下拉提示
     * @return {string}
     */
    hilighted() {
      const boldQuerySegement = this.suggestion.value.replace(this.query, matched => `<b>${matched}</b>`);

      return boldQuerySegement;
    },

    ...mapState([
      'query',
    ]),

    // query() {
    //   return this.$store.state.query;
    // },
  },

  methods: {
    handleClick({ value }) {
      this.$store.commit(SET_QUERY, { query: value });
      this.$store.dispatch(FETCH_SUGGESTIONS);
    },
  },
};
</script>

<style scoped lang="less">
li {
  height: 32px;
  line-height: 32px;
  text-align: left;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  cursor: pointer;

  &:hover {
    background: #f6f7fb;
  }

  .top3 {
    color: #f60;
  }
}
</style>
