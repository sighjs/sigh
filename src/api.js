import Resource from './Resource'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

export { Resource }

/// Run the Sigh.js file in the current directory with the given options.
export function invoke(opts) {
  console.log("TODO: invoke sigh %j", opts)

  var sighPkgs = []

  var packageJson = JSON.parse(fs.readFileSync('package.json'))
  ; [ packageJson.devDependencies, packageJson.dependencies ].forEach(deps => {
    if (! deps)
      return

    _.forEach(deps, function(version, pkg) {
      if (/^sigh-/.test(pkg))
        sighPkgs.push(pkg)
    })
  })

  var sighModule = require(path.join(process.cwd(), 'Sigh'))
  // sighModule.__set__('path', 'poo')

  console.log("sigh packages", sighPkgs)

}
