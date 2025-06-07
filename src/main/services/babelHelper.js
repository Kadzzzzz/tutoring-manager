// src/main/services/babelHelper.js
// Helper pour gérer les imports Babel de manière compatible

/**
 * Import de @babel/parser
 */
function getBabelParser() {
  try {
    const parser = require('@babel/parser')
    return parser.parse ? parser : parser.default
  } catch (error) {
    console.error('Erreur import @babel/parser:', error)
    throw error
  }
}

/**
 * Import de @babel/traverse
 */
function getBabelTraverse() {
  try {
    const traverse = require('@babel/traverse')

    // Tester différents types d'exports
    if (typeof traverse === 'function') {
      return traverse
    } else if (traverse.default && typeof traverse.default === 'function') {
      return traverse.default
    } else if (traverse.traverse && typeof traverse.traverse === 'function') {
      return traverse.traverse
    } else {
      console.error('Traverse object:', traverse)
      throw new Error('Cannot find traverse function')
    }
  } catch (error) {
    console.error('Erreur import @babel/traverse:', error)
    throw error
  }
}

/**
 * Import de @babel/generator
 */
function getBabelGenerator() {
  try {
    const generator = require('@babel/generator')

    // Tester différents types d'exports
    if (typeof generator === 'function') {
      return generator
    } else if (generator.default && typeof generator.default === 'function') {
      return generator.default
    } else if (generator.generate && typeof generator.generate === 'function') {
      return generator.generate
    } else {
      console.error('Generator object:', generator)
      throw new Error('Cannot find generator function')
    }
  } catch (error) {
    console.error('Erreur import @babel/generator:', error)
    throw error
  }
}

/**
 * Import de @babel/types
 */
function getBabelTypes() {
  try {
    const types = require('@babel/types')
    return types.default || types
  } catch (error) {
    console.error('Erreur import @babel/types:', error)
    throw error
  }
}

/**
 * Import de prettier
 */
function getPrettier() {
  try {
    const prettier = require('prettier')
    return prettier.default || prettier
  } catch (error) {
    console.error('Erreur import prettier:', error)
    throw error
  }
}

// Exports
module.exports = {
  parse: getBabelParser().parse,
  traverse: getBabelTraverse(),
  generate: getBabelGenerator(),
  t: getBabelTypes(),
  prettier: getPrettier()
}

// Debug
console.log('🔧 BabelHelper: Modules Babel chargés avec succès')