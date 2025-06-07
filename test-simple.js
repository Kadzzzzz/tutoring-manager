#!/usr/bin/env node

// test-simple.js - Test simple qui DOIT marcher
console.log('🧪 Test simple des services\n')

async function testSimple() {
  try {
    console.log('1️⃣  Test des imports...')

    // Test fileService
    const fileService = require('./src/main/services/fileService')
    console.log('✅ fileService importé')

    // Test resourceParser
    const resourceParser = require('./src/main/services/resourceParser')
    console.log('✅ resourceParser importé')
    console.log('   Functions:', Object.keys(resourceParser))

    // Test codeGenerator
    const codeGenerator = require('./src/main/services/codeGenerator')
    console.log('✅ codeGenerator importé')
    console.log('   Functions:', Object.keys(codeGenerator))

    console.log('\n2️⃣  Test de parsing simple...')

    // Test de parsing d'un code simple
    const simpleCode = `<script setup>
const resources = [
  {
    id: 'test1',
    subject: 'maths',
    levelKey: 'terminale',
    typeKey: 'exercise',
    duration: '1h'
  }
]
</script>`

    const parsedResources = resourceParser.extractResourcesFromAppVue(simpleCode)
    console.log('✅ Parsing réussi')
    console.log('   Ressources trouvées:', parsedResources.length)
    console.log('   Première ressource:', parsedResources[0])

    console.log('\n3️⃣  Test des statistiques...')
    const stats = resourceParser.getResourcesStats(parsedResources)
    console.log('✅ Statistiques générées:', stats)

    console.log('\n4️⃣  Test de validation...')
    resourceParser.validateResource(parsedResources[0])
    console.log('✅ Validation réussie')

    console.log('\n🎉 TOUS LES TESTS SIMPLES RÉUSSIS!')
    console.log('\nL\'application devrait maintenant fonctionner. Essayez:')
    console.log('   npm start')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testSimple()