import jsTypes from 'js-types'

/**
 * Determine if a type is JS type
 * @param {String} type - type to verify
 * @return {Boolean} - type is a JS type
 */
export default type => {
  if (typeof type !== 'string') {
    throw new TypeError('Expected type to be a string')
  }

  return jsTypes.indexOf(type) > -1
}
