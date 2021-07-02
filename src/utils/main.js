// Libs
import $ from 'jquery'; window.jQuery = $; window.$ = $

// Blocks
window.addEventListener('load', () => {
    importAll(require.context('../partials', true, /\.(js)$/));
    importAll(require.context('../pages', true, /\.(js)$/));
  });

// Custom JS
document.addEventListener('DOMContentLoaded', () => {

})

function importAll(r) {
    r.keys().forEach(r);
  }