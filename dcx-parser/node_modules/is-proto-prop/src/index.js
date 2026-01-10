import lowercaseKeys from 'lowercase-keys'
import protoProps from 'prototype-properties'

const lowerProtoProps = lowercaseKeys(protoProps)

/**
 * Determine if a property belongs to a type's prototype
 * @param {String} type - JS type
 * @param {String} property - name of property
 * @return {Boolean} - type has property on its prototype
 */
export default (type, property) => {
  if (typeof type !== 'string' || typeof property !== 'string') {
    throw new TypeError('Expected a string')
  }

  const lowerType = type.toLowerCase()

  return !!lowerProtoProps[lowerType] && lowerProtoProps[lowerType].indexOf(property) > -1
}
