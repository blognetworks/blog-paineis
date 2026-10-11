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

// Módulos ES novos (002): navegação parcial, sumário, painéis, atalhos, filtro, datas e service worker.
import './webpack/js/main.js';
