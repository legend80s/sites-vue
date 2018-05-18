import Vue from 'vue';
import Vuex from 'vuex';
import VueJsonp from 'vue-jsonp';
import {
  SET_QUERY,
  SET_SUGGESTIONS,

  FETCH_SUGGESTIONS,
} from './mutation-types';


Vue.use(Vuex);
Vue.use(VueJsonp);

const inProduction = process.env.NODE_ENV === 'production';

const store = new Vuex.Store({
  strict: !inProduction,

  state: {
    query: '',
    suggestions: [],
  },

  mutations: {
    [SET_QUERY](state, { query }) {
      state.query = query;
    },

    [SET_SUGGESTIONS](state, { suggestions }) {
      state.suggestions = suggestions;
    },
  },

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
});

export default store;

