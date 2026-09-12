import { boot } from 'quasar/wrappers';
import axios from 'axios';
import api from '../services/api.js';

export default boot(({ app }) => {
  // Acceso global a axios y al cliente de api con this.$axios y this.$api en Options API
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
