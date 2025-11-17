/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true
  },
  ignoredRouteFiles: ['**/.*'],
  sourceMaps: true,
  serverModuleFormat: 'cjs',
  serverBuildPath: 'build/index.cjs'
};
