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
/* eslint-disable no-console */
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

<style scoped lang="less">
.suggestion-list-wrapper {
  border: 1px solid #ccc;
  box-shadow: 0 0 6px 1px rgba(229,229,229,.8);

  ol {
    margin: 0;
    padding: 15px;
  }
}
</style>
