
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 5129, hash: 'e25d4e3af8e988b42da293ff6f9f45c58c7ab49906c5dc5163335c96ba53d74e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 990, hash: 'ffc5b6c010571c3d02a73ad09bd032963a69ce1987e3d0b466d3314517e09fc3', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 16864, hash: '0c5bd72e470a93aef311ad4fd39ecd171580fc273a5d2c68f2208dab478f98ab', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-X4JFUKKX.css': {size: 15912, hash: 'd9nLDoZkHZA', text: () => import('./assets-chunks/styles-X4JFUKKX_css.mjs').then(m => m.default)}
  },
};
