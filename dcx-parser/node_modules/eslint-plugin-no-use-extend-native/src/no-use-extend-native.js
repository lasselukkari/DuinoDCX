import isGetSetProp from 'is-get-set-prop'
import isJsType from 'is-js-type'
import isObjProp from 'is-obj-prop'
import isProtoProp from 'is-proto-prop'

/**
 * Return type of value of left or right
 * @param {Object} o - left or right of node.object
 * @return {String} - type of o
 */
const getType = o => {
  const type = typeof o.value

  if (o.regex) {
    return 'RegExp'
  }

  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Returns type of binary expression result
 * @param {Object} o - node's object with a BinaryExpression type
 * @return {String} - type of value produced
 */
const binaryExpressionProduces = o => {
  const leftType = o.left.type === 'BinaryExpression' ? binaryExpressionProduces(o.left) : getType(o.left)
  const rightType = o.right.type === 'BinaryExpression' ? binaryExpressionProduces(o.right) : getType(o.right)

  const isRegExp = leftType === rightType && leftType === 'RegExp'
  if (leftType === 'String' || rightType === 'String' || isRegExp) {
    return 'String'
  }

  if (leftType === rightType) {
    return leftType
  }

  return 'Unknown'
}

/**
 * Returns the JS type and property name
 * @param {Object} node - node to examine
 * @return {Object} - jsType and propertyName
 */
const getJsTypeAndPropertyName = node => {
  let propertyName, jsType

  switch (node.object.type) {
    case 'NewExpression':
      jsType = node.object.callee.name
      break
    case 'Literal':
      jsType = getType(node.object)
      break
    case 'BinaryExpression':
      jsType = binaryExpressionProduces(node.object)
      break
    case 'Identifier':
      if (node.property.name === 'prototype' && node.parent.property) {
        jsType = node.object.name
        propertyName = node.parent.property.name
      } else {
        jsType = node.object.name
      }
      break
    default:
      jsType = node.object.type.replace('Expression', '')
  }

  propertyName = propertyName || node.property.name || node.property.value

  return {propertyName, jsType}
}

const isUnkownGettSetterOrJsTypeExpressed = (jsType, propertyName, usageType) => {
  const isExpression = usageType === 'ExpressionStatement' || usageType === 'MemberExpression'

  return isExpression && !isGetSetProp(jsType, propertyName) &&
    !isProtoProp(jsType, propertyName) && !isObjProp(jsType, propertyName)
}

/**
 * Determine if a jsType's usage of propertyName is valid
 * @param {String} jsType - the JS type to validate
 * @param {String} propertyName - the property name to validate usage of on jsType
 * @param {String} usageType - how propertyName is being used
 * @return {Boolean} - is the usage invalid?
 */
const isInvalid = (jsType, propertyName, usageType) => {
  if (typeof propertyName !== 'string' || typeof jsType !== 'string' || !isJsType(jsType)) {
    return false
  }

  const unknownGetterSetterOrjsTypeExpressed = isUnkownGettSetterOrJsTypeExpressed(jsType, propertyName, usageType)

  const isFunctionCall = usageType === 'CallExpression'
  const getterSetterCalledAsFunction = isFunctionCall && isGetSetProp(jsType, propertyName)

  const unknownjsTypeCalledAsFunction = isFunctionCall && !isProtoProp(jsType, propertyName) &&
    !isObjProp(jsType, propertyName)

  return unknownGetterSetterOrjsTypeExpressed || getterSetterCalledAsFunction || unknownjsTypeCalledAsFunction
}

export default {
  meta: {
    type: 'problem',
    messages: {
      message: 'Avoid using extended native objects',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        /* eslint complexity: [2, 9] */
        if (node.computed && node.property.type === 'Identifier') {
          /**
           * handles cases like {}[i][j]
           * not enough information to identify type of variable in computed properties
           * so ignore false positives by not performing any checks
           */

          return
        }

        const isArgToParent = node.parent.arguments && node.parent.arguments.indexOf(node) > -1
        const usageType = isArgToParent ? node.type : node.parent.type

        const {propertyName, jsType} = getJsTypeAndPropertyName(node)

        if (isInvalid(jsType, propertyName, usageType) && isInvalid('Function', propertyName, usageType)) {
          context.report({node, messageId: 'message'})
        }
      }
    }
  }
}
