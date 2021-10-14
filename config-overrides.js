let { babelInclude, override } = require('customize-cra')
let path = require('path')
let fs = require('fs')
let designSystemPath = path.resolve(__dirname, '..', '..', 'design-system')
/* config-overrides.js */
module.exports = fs.existsSync(designSystemPath)
  ? override(babelInclude([path.resolve('src'), designSystemPath]))
  : {}
