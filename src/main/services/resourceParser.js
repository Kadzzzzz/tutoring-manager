// src/main/services/resourceParser.js
// Service for parsing existing resources using Babel AST

const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default || require('@babel/traverse')
const t = require('@babel/types')

/**
 * Service for parsing existing resources from files
 * Uses Babel AST to extract data from JavaScript files
 */

// ==========================================
// AST VALUE PARSING UTILITIES
// ==========================================

/**
 * Parses any type of AST node value to JavaScript value
 * @param {Object} node - Babel AST node
 * @returns {*} Parsed JavaScript value
 */
function parseValue(node) {
  if (t.isStringLiteral(node)) {
    return node.value
  } else if (t.isNumericLiteral(node)) {
    return node.value
  } else if (t.isBooleanLiteral(node)) {
    return node.value
  } else if (t.isArrayExpression(node)) {
    return parseArrayElements(node.elements)
  } else if (t.isObjectExpression(node)) {
    return parseObjectExpression(node)
  } else if (t.isNullLiteral(node)) {
    return null
  } else if (node === undefined || node === null) {
    return undefined
  } else {
    // For unsupported cases, return string representation
    return '[Unsupported value type]'
  }
}

/**
 * Parses array elements from ArrayExpression
 * @param {Array} elements - Array of AST nodes
 * @returns {Array} Parsed JavaScript array
 */
function parseArrayElements(elements) {
  return elements.map(element => {
    if (t.isObjectExpression(element)) {
      return parseObjectExpression(element)
    }
    return parseValue(element)
  })
}

/**
 * Parses ObjectExpression to JavaScript object
 * @param {Object} node - Babel AST ObjectExpression node
 * @returns {Object} Parsed JavaScript object
 */
function parseObjectExpression(node) {
  if (!t.isObjectExpression(node)) {
    return parseValue(node)
  }

  const obj = {}

  for (const property of node.properties) {
    if (t.isObjectProperty(property)) {
      let key

      // Get the key
      if (t.isIdentifier(property.key)) {
        key = property.key.name
      } else if (t.isStringLiteral(property.key)) {
        key = property.key.value
      } else {
        continue // Skip unsupported keys
      }

      // Get the value
      obj[key] = parseValue(property.value)
    }
  }

  return obj
}

// ==========================================
// FILE EXTRACTION FUNCTIONS
// ==========================================

/**
 * Extracts resources array from App.vue file
 * @param {string} appVueContent - App.vue file content
 * @returns {Array} Array of resource objects
 * @throws {Error} If extraction fails
 */
function extractResourcesFromAppVue(appVueContent) {
  try {
    // Extract <script setup> section
    const scriptMatch = appVueContent.match(/<script setup>([\s\S]*?)<\/script>/)
    if (!scriptMatch) {
      throw new Error('<script setup> section not found in App.vue')
    }

    const scriptContent = scriptMatch[1]

    // Parse JavaScript
    const ast = parse(scriptContent, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    let resources = []

    // Traverse AST to find const resources declaration
    traverse(ast, {
      VariableDeclarator(path) {
        if (
          t.isIdentifier(path.node.id, { name: 'resources' }) &&
          t.isArrayExpression(path.node.init)
        ) {
          // Convert array elements to JavaScript objects
          resources = parseArrayElements(path.node.init.elements)
        }
      }
    })

    return resources
  } catch (error) {
    throw new Error(`Error extracting resources: ${error.message}`)
  }
}

/**
 * Extracts translations from translations.js file
 * @param {string} translationsContent - translations.js file content
 * @returns {Object|null} Parsed translations object
 * @throws {Error} If extraction fails
 */
function extractTranslationsFromFile(translationsContent) {
  try {
    // Remove export and keep only the object
    let jsContent = translationsContent.replace(/export\s+const\s+translations\s*=\s*/, 'const translations = ')

    // Add module.exports for Node.js
    if (!jsContent.includes('module.exports')) {
      jsContent += '\nmodule.exports = { translations };'
    }

    // Parse JavaScript using controlled eval
    const module = { exports: {} }
    const requireFunc = () => ({}) // Mock require

    // Evaluate code safely
    const func = new Function('module', 'exports', 'require', jsContent)
    func(module, module.exports, requireFunc)

    return module.exports.translations || null
  } catch (error) {
    // Fallback: try using Babel
    try {
      const ast = parse(translationsContent, {
        sourceType: 'module',
        plugins: ['objectRestSpread']
      })

      let translations = null

      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
            const declarator = path.node.declaration.declarations[0]
            if (t.isIdentifier(declarator.id, { name: 'translations' })) {
              translations = parseObjectExpression(declarator.init)
            }
          }
        }
      })

      return translations
    } catch (babelError) {
      throw new Error(`Error extracting translations: ${error.message}. Babel error: ${babelError.message}`)
    }
  }
}

// ==========================================
// RESOURCE SEARCH FUNCTIONS
// ==========================================

/**
 * Finds a specific resource by ID
 * @param {Array} resources - Array of resources
 * @param {string} resourceId - Resource ID to find
 * @returns {Object|undefined} Found resource or undefined
 */
function findResourceById(resources, resourceId) {
  return resources.find(resource => resource.id === resourceId)
}

/**
 * Finds translations for a specific resource
 * @param {Object} translations - Complete translations object
 * @param {string} subject - Subject key
 * @param {string} resourceId - Resource ID
 * @returns {Object} Object with fr and en translations
 */
function findResourceTranslations(translations, subject, resourceId) {
  try {
    const frTranslations = translations?.fr?.resources?.exercises?.[subject]?.[resourceId]
    const enTranslations = translations?.en?.resources?.exercises?.[subject]?.[resourceId]

    return {
      fr: frTranslations || {},
      en: enTranslations || {}
    }
  } catch (error) {
    return { fr: {}, en: {} }
  }
}

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates that a resource has all required fields
 * @param {Object} resource - Resource object to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateResource(resource) {
  const requiredFields = ['id', 'subject', 'levelKey', 'typeKey', 'duration']
  const missingFields = requiredFields.filter(field => !resource[field])

  if (missingFields.length > 0) {
    throw new Error(`Missing fields in resource: ${missingFields.join(', ')}`)
  }

  // Validate enum values
  const validSubjects = ['maths', 'physics', 'chemistry']
  const validLevels = ['terminale', 'prepa1', 'prepa2']
  const validTypes = ['exercise', 'course', 'method', 'interro']

  if (!validSubjects.includes(resource.subject)) {
    throw new Error(`Invalid subject: ${resource.subject}`)
  }

  if (!validLevels.includes(resource.levelKey)) {
    throw new Error(`Invalid level: ${resource.levelKey}`)
  }

  if (!validTypes.includes(resource.typeKey)) {
    throw new Error(`Invalid type: ${resource.typeKey}`)
  }

  return true
}

/**
 * Validates resource translations
 * @param {Object} translations - Translations object with fr and en properties
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateResourceTranslations(translations) {
  if (!translations.fr?.title) {
    throw new Error('French title required')
  }

  if (!translations.fr?.description) {
    throw new Error('French description required')
  }

  if (!translations.en?.title) {
    throw new Error('English title required')
  }

  if (!translations.en?.description) {
    throw new Error('English description required')
  }

  return true
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Generates a unique ID for a new resource
 * @param {Array} existingResources - Array of existing resources
 * @param {string} baseId - Base ID to make unique
 * @returns {string} Unique resource ID
 */
function generateUniqueId(existingResources, baseId) {
  if (!existingResources.find(r => r.id === baseId)) {
    return baseId
  }

  let counter = 1
  let newId = `${baseId}${counter}`

  while (existingResources.find(r => r.id === newId)) {
    counter++
    newId = `${baseId}${counter}`
  }

  return newId
}

/**
 * Gets statistics about resources
 * @param {Array} resources - Array of resources
 * @returns {Object} Statistics object
 */
function getResourcesStats(resources) {
  const stats = {
    total: resources.length,
    bySubject: {},
    byLevel: {},
    byType: {},
    withVideo: 0,
    withPdfs: 0
  }

  resources.forEach(resource => {
    // By subject
    stats.bySubject[resource.subject] = (stats.bySubject[resource.subject] || 0) + 1

    // By level
    stats.byLevel[resource.levelKey] = (stats.byLevel[resource.levelKey] || 0) + 1

    // By type
    stats.byType[resource.typeKey] = (stats.byType[resource.typeKey] || 0) + 1

    // With video
    if (resource.hasVideo) {
      stats.withVideo++
    }

    // With PDFs
    if (resource.pdfStatement || resource.pdfSolution) {
      stats.withPdfs++
    }
  })

  return stats
}

module.exports = {
  extractResourcesFromAppVue,
  extractTranslationsFromFile,
  findResourceById,
  findResourceTranslations,
  validateResource,
  validateResourceTranslations,
  generateUniqueId,
  getResourcesStats
}