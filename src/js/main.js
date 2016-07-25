import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

// http相关
Vue.http.options.crossOrigin = true;
Vue.http.options.xhr = { withCredentials: true };

/* eslint no-new: off */
new Vue({
  el: 'body',
  data: {
    title: 'hahaha',
    msg: 'Hello',
  },
});
