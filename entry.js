// A ordem importa: vendor.js publica as globais antes dos plugins e dos módulos legados.
import './webpack/js/vendor.js';
import 'jquery-pjax';
import 'jquery-lazyload';
import 'nprogress/nprogress.css';

// Fontes locais (Fontsource): o esbuild emite os .woff/.woff2 em src/js/fonts/.
import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/400-italic.css';
import '@fontsource/jetbrains-mono/600.css';

import './webpack/js/theme.js';

import './webpack/js/0filter&highlight.js';
import './webpack/js/5mobile.js';
import './webpack/js/7structurebar(pjax).js';
import './webpack/js/9btn.js';
import './webpack/js/9dragbar.js';
import './webpack/js/9ES6-scroll.js';
import './webpack/js/9lazyload.js';
import './webpack/js/9serviceworker.js';
import './webpack/js/9showAll(eye).js';
