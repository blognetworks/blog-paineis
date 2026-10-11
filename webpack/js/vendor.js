// Publica as globais que os plugins jQuery e os módulos legados esperam.
// Importado primeiro em entry.js: jquery-pjax e jquery-lazyload leem `jQuery` ao serem avaliados.
import jQuery from 'jquery';
import NProgress from 'nprogress';

window.$ = window.jQuery = jQuery;
window.NProgress = NProgress;
