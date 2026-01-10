import lowercaseKeys from 'lowercase-keys'
import objProps from 'obj-props'

const lowerObjProps = lowercaseKeys(objProps)

/**
 * Determine if a proptery belongs to a JS type
 * @param {String} type - JS type
 * @param {String} property - name of property
 * @return {Boolean} - type has named property
 */
export default (type, property) => {
  if (typeof type !== 'string' || typeof property !== 'string') {
    throw new TypeError('Expected a string')
  }

  const lowerType = type.toLowerCase()

  return !!lowerObjProps[lowerType] && lowerObjProps[lowerType].indexOf(property) > -1
}
