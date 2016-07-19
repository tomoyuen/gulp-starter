'use strict';

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _vueResource = require('vue-resource');

var _vueResource2 = _interopRequireDefault(_vueResource);

var _button = require('../components/button.vue');

var _button2 = _interopRequireDefault(_button);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_vue2.default.use(_vueResource2.default);

// http相关
_vue2.default.http.options.crossOrigin = true;
_vue2.default.http.options.xhr = { withCredentials: true };

var vm = new _vue2.default({
  el: 'body',
  data: {},
  components: {
    App: _button2.default
  }
});