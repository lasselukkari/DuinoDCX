import rule from './src/no-use-extend-native.js'
import pkg from './package.json' with {type: 'json'}

const {name, version} = pkg

const plugin = {
  meta: {
    name,
    version
  },
  rules: {
    'no-use-extend-native': rule
  },
  configs: {},
}

Object.assign(plugin.configs, {
  recommended: {
    name: 'no-use-extend-native/recommended',
    plugins: {
      'no-use-extend-native': plugin
    },
    rules: {
      'no-use-extend-native/no-use-extend-native': 2
    }
  }
})

export default plugin
