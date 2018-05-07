<template>
  <div id="app">
    <img src="https://cn.vuejs.org/images/icons/favicon-96x96.png">
    <SearchBox/>
  </div>
</template>

<script>
import 'element-ui/lib/theme-chalk/index.css';
// import HelloWorld from './components/HelloWorld';
import SearchBox from './components/SearchBox';

export default {
  name: 'App',
  components: {
    SearchBox,
  },
};

</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
