#!/usr/bin/env node

// diagnose-babel.js - Diagnostic des imports Babel
console.log('🔍 Diagnostic des imports Babel\n')

try {
  console.log('📦 Test @babel/parser...')
  const parser = require('@babel/parser')
  console.log('✅ @babel/parser importé')
  console.log('   Type:', typeof parser)
  console.log('   Has parse:', typeof parser.parse)
  console.log('   Has default:', typeof parser.default)

  console.log('\n📦 Test @babel/traverse...')
  const traverse = require('@babel/traverse')
  console.log('✅ @babel/traverse importé')
  console.log('   Type:', typeof traverse)
  console.log('   Has default:', typeof traverse.default)
  console.log('   Direct callable:', typeof traverse === 'function')
  console.log('   Default callable:', typeof traverse.default === 'function')

  console.log('\n📦 Test @babel/generator...')
  const generator = require('@babel/generator')
  console.log('✅ @babel/generator importé')
  console.log('   Type:', typeof generator)
  console.log('   Has default:', typeof generator.default)
  console.log('   Direct callable:', typeof generator === 'function')
  console.log('   Default callable:', typeof generator.default === 'function')

  console.log('\n📦 Test @babel/types...')
  const types = require('@babel/types')
  console.log('✅ @babel/types importé')
  console.log('   Type:', typeof types)
  console.log('   Has default:', typeof types.default)
  console.log('   Has isIdentifier:', typeof types.isIdentifier)

  console.log('\n📦 Test prettier...')
  const prettier = require('prettier')
  console.log('✅ prettier importé')
  console.log('   Type:', typeof prettier)
  console.log('   Has format:', typeof prettier.format)
  console.log('   Has default:', typeof prettier.default)

  console.log('\n🧪 Test de parsing simple...')
  const code = 'const x = 1'
  const ast = parser.parse(code, { sourceType: 'module' })
  console.log('✅ Parsing réussi')

  console.log('\n🧪 Test de traverse...')
  let traverseFunction
  if (typeof traverse === 'function') {
    traverseFunction = traverse
    console.log('   Utilise traverse direct')
  } else if (traverse.default && typeof traverse.default === 'function') {
    traverseFunction = traverse.default
    console.log('   Utilise traverse.default')
  } else {
    console.error('   Traverse object keys:', Object.keys(traverse))
    throw new Error('Cannot find traverse function')
  }

  let visited = false
  traverseFunction(ast, {
    VariableDeclarator() {
      visited = true
    }
  })

  if (visited) {
    console.log('✅ Traverse fonctionne')
  } else {
    console.log('❌ Traverse ne fonctionne pas')
  }

  console.log('\n🧪 Test de generator...')
  let generateFunction
  if (typeof generator === 'function') {
    generateFunction = generator
    console.log('   Utilise generator direct')
  } else if (generator.default && typeof generator.default === 'function') {
    generateFunction = generator.default
    console.log('   Utilise generator.default')
  } else {
    console.error('   Generator object keys:', Object.keys(generator))
    throw new Error('Cannot find generate function')
  }

  const result = generateFunction(ast)
  console.log('✅ Generate fonctionne')
  console.log('   Result type:', typeof result)
  console.log('   Has code:', typeof result.code)

  console.log('\n🎉 Tous les tests Babel réussis!')

} catch (error) {
  console.error('❌ Erreur lors du diagnostic:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}