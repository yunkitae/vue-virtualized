export default {
  srcDir: 'demo/',
  modern: 'client',
  buildModules: ['@nuxt/typescript-build'],
  server: {
    timing: {
      total: true
    },
    host: '0.0.0.0' // default: localhost,
  },
  head: {
    title: 'Vue virtualized plugin',
    htmlAttrs: {
      lang: 'ko'
    },
    meta: [
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, user-scalable=no' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' }
    ]
  },
  modules: [
    '@nuxtjs/style-resources',
  ],
  loadingIndicator: '~/assets/indicators/three-bounce.html',
  plugins: [{ src: '~/plugins/virtualized.ts', mode: 'client' }],
  css: [{ src: '~/assets/scss/_base.scss', lang: 'scss' }]
};
