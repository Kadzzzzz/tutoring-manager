#!/usr/bin/env node

// fix-translations.js - Script pour corriger le fichier translations.js
const fs = require('fs-extra')
const path = require('path')

console.log('🔧 Correction du fichier translations.js\n')

async function fixTranslationsFile() {
  try {
    const webProjectPath = path.join(require('os').homedir(), 'Documents', 'jeremy-tutoring')
    const translationsPath = path.join(webProjectPath, 'src', 'i18n', 'translations.js')

    console.log('📁 Chemin du projet web:', webProjectPath)
    console.log('📄 Chemin du fichier translations:', translationsPath)

    // Vérifier que le fichier existe
    if (!await fs.pathExists(translationsPath)) {
      console.error('❌ Le fichier translations.js n\'existe pas à:', translationsPath)
      console.log('   Assurez-vous que le projet jeremy-tutoring existe')
      process.exit(1)
    }

    // Faire une sauvegarde
    const backupPath = translationsPath + '.backup.' + Date.now()
    await fs.copy(translationsPath, backupPath)
    console.log('✅ Sauvegarde créée:', backupPath)

    // Lire le fichier actuel
    const currentContent = await fs.readFile(translationsPath, 'utf8')
    console.log('✅ Fichier lu, taille:', currentContent.length, 'caractères')

    // Nouveau contenu corrigé
    const newContent = `// src/i18n/translations.js
// 🌍 FICHIER CENTRAL DE TOUTES LES TRADUCTIONS

export const translations = {
  fr: {
    nav: {
      about: "À propos",
      resources: "Ressources",
      methodology: "Méthode",
      contact: "Contact"
    },
    hero: {
      subtitle: "Étudiant Ingénieur & Professeur Particulier",
      title: "Réussissez vos études scientifiques",
      description: "Cours particuliers en Mathématiques, Physique et Chimie pour lycéens et préparationnaires.",
      scrollDown: "Découvrir"
    },
    about: {
      title: "Mon Parcours",
      paragraph1: "Actuellement étudiant en première année à l'École Centrale de Lyon et en parallèle en L3 de Physique à l'Université Claude Bernard Lyon 1, je mets ma passion pour les sciences au service de la réussite de mes élèves.",
      paragraph2: "Fort de mon expérience en classes préparatoires (PCSI puis PC à l'ENCPB, et PC* au lycée Louis-le-Grand), je comprends parfaitement les défis que rencontrent les étudiants dans ces filières exigeantes.",
      paragraph3: "J'aime beaucoup transmettre mon savoir et ma passion pour les sciences. C'est pourquoi je donne régulièrement des cours particuliers à des élèves allant de la seconde à la première année de prépa, et je gère également des salles de travail à Centrale.",
      academicPath: "Parcours Académique",
      timeline: {
        prepa: "Prépa PCSI puis PC - ENCPB Paris",
        prepastar: "Prépa PC* - Lycée Louis-le-Grand",
        centrale: "École Centrale de Lyon",
        physics: "L3 Physique - Université Claude Bernard Lyon 1"
      }
    },
    resources: {
      title: "Ressources Pédagogiques",
      description: "Découvrez mes exercices corrigés, cours et méthodes classés par matière et niveau. Chaque ressource est accompagnée de corrections détaillées et parfois de vidéos explicatives.",
      subjects: {
        maths: "Mathématiques",
        physics: "Physique",
        chemistry: "Chimie"
      },
      types: {
        exercise: "Exercice",
        course: "Cours",
        method: "Méthode",
        interro: "Interrogation"
      },
      levels: {
        terminale: "Terminale",
        prepa1: "Prépa 1A",
        prepa2: "Prépa 2A"
      },
      downloadTypes: {
        statement: "Énoncé",
        solution: "Correction"
      },
      hasVideo: "Vidéo",
      notes: "Notes et conseils",
      noPdfAvailable: "Documents PDF en cours de préparation",
      exercises: {
        maths: {
          interro0LLG: {
            title: "Interrogation 0 PC*",
            description: "Couvre arithmétique, combinatoire et analyse.",
            fullDescription: "L'exercice 1 traite de l'irrationnalité de ln(3)/ln(2) par une démonstration par l'absurde.\\nL'exercice 2 développe l'arithmétique des nombres premiers avec des estimations logarithmiques et aboutit à la preuve de l'infinité des nombres premiers.\\nLes exercices 3 et 5 explorent la combinatoire des ensembles finis : dénombrement de parties avec contraintes, formule de la crosse de hockey, et propriétés des intersections démontrées par récurrence.\\nL'exercice 4 combine analyse et trigonométrie avec des inégalités sur des suites, l'utilisation de l'arctangente, et des identités impliquant tan(π/12) = 2 - √3.",
            notes: "Interrogation de haut niveau nécessitant une excellente maîtrise des techniques fondamentales. L'exercice est issu de la PC*3 du Lycée Louis-le-Grand."
          },
          integrals: {
            title: "test",
            description: "test",
            fullDescription: "test description complète",
            notes: "test notes"
          }
        },
        physics: {
          mechanics: {
            title: "Mécanique du point",
            description: "Cours et exercices sur la cinématique et la dynamique",
            fullDescription: "Étude complète de la mécanique du point : référentiels, vitesse, accélération, forces et théorèmes de Newton.",
            notes: "Exercices progressifs avec corrections détaillées"
          },
          electromagnetism: {
            title: "Électromagnétisme",
            description: "Équations de Maxwell et applications",
            fullDescription: "Étude des champs électriques et magnétiques, équations de Maxwell et applications en électrostatique et magnétostatique.",
            notes: "Théorie et applications pratiques"
          }
        },
        chemistry: {
          equilibrium: {
            title: "Équilibres chimiques",
            description: "Constantes d'équilibre et déplacements",
            fullDescription: "Étude des équilibres chimiques, calcul des constantes d'équilibre et loi de Le Chatelier.",
            notes: "Méthodes de calcul et exemples concrets"
          },
          kinetics: {
            title: "Cinétique chimique",
            description: "Vitesse de réaction et mécanismes",
            fullDescription: "Étude de la vitesse des réactions chimiques, ordres de réaction et mécanismes réactionnels.",
            notes: "Approche expérimentale et théorique"
          }
        }
      }
    },
    methodology: {
      title: "Ma Méthode Pédagogique",
      item1: {
        title: "Transmission de la Passion",
        description: "Je crois fermement qu'exceller dans une discipline est beaucoup plus simple quand on l'aime. C'est pourquoi je m'attache à transmettre ma passion pour les sciences autant que mes connaissances."
      },
      item2: {
        title: "Écoute et Personnalisation",
        description: "Chaque élève est unique. Je suis très à l'écoute de mes élèves pour adapter ma pédagogie à leur profil, leurs difficultés et leurs objectifs personnels."
      },
      item3: {
        title: "Approche Bienveillante",
        description: "En tant que jeune étudiant tout juste sorti de prépa, je comprends les défis que vivent mes élèves. J'offre un encadrement bienveillant qui permet de prendre confiance et de se projeter dans la réussite."
      }
    },
    contact: {
      title: "Me Contacter",
      email: "Email",
      levels: "Niveaux enseignés",
      levelsDescription: "De la Seconde à la Prépa (1A et 2A)",
      followMe: "Me suivre"
    },
    footer: {
      rights: "Tous droits réservés"
    }
  },
  en: {
    nav: {
      about: "About",
      resources: "Resources",
      methodology: "Method",
      contact: "Contact"
    },
    hero: {
      subtitle: "Engineering Student & Private Tutor",
      title: "Excel in Scientific Studies",
      description: "Private lessons in Mathematics, Physics and Chemistry for high school and preparatory students.",
      scrollDown: "Discover"
    },
    about: {
      title: "My Background",
      paragraph1: "Currently a first-year student at École Centrale de Lyon and simultaneously pursuing a L3 in Physics at Claude Bernard Lyon 1 University, I put my passion for science at the service of my students' success.",
      paragraph2: "With my experience in preparatory classes (PCSI then PC at ENCPB, and PC* at Louis-le-Grand high school), I perfectly understand the challenges that students face in these demanding programs.",
      paragraph3: "I love sharing my knowledge and passion for science. That's why I regularly give private lessons to students from sophomore year to first year of prep school, and I also manage study rooms at Centrale.",
      academicPath: "Academic Path",
      timeline: {
        prepa: "Prep PCSI then PC - ENCPB Paris",
        prepastar: "Prep PC* - Louis-le-Grand High School",
        centrale: "École Centrale de Lyon",
        physics: "L3 Physics - Claude Bernard Lyon 1 University"
      }
    },
    resources: {
      title: "Educational Resources",
      description: "Discover my corrected exercises, courses and methods classified by subject and level. Each resource comes with detailed corrections and sometimes explanatory videos.",
      subjects: {
        maths: "Mathematics",
        physics: "Physics",
        chemistry: "Chemistry"
      },
      types: {
        exercise: "Exercise",
        course: "Course",
        method: "Method",
        interro: "Quiz"
      },
      levels: {
        terminale: "Senior Year",
        prepa1: "Prep 1st Year",
        prepa2: "Prep 2nd Year"
      },
      downloadTypes: {
        statement: "Statement",
        solution: "Solution"
      },
      hasVideo: "Video",
      notes: "Notes and tips",
      noPdfAvailable: "PDF documents in preparation",
      exercises: {
        maths: {
          interro0LLG: {
            title: "Quiz 0 PC*",
            description: "Covering arithmetic, combinatorics, and analysis.",
            fullDescription: "Exercise 1 deals with the irrationality of ln(3)/ln(2) through a proof by contradiction.\\nExercise 2 explores prime number arithmetic using logarithmic estimates and leads to a proof of the infinitude of prime numbers.\\nExercises 3 and 5 delve into combinatorics on finite sets: counting subsets under constraints, the hockey stick identity, and properties of intersections proved by induction.\\nExercise 4 combines analysis and trigonometry with inequalities on sequences, the use of arctangent, and identities involving tan(π/12) = 2 - √3.",
            notes: "High-level quiz requiring excellent command of fundamental techniques. The exercise originates from the PC*3 class at Lycée Louis-le-Grand."
          },
          integrals: {
            title: "test",
            description: "test",
            fullDescription: "test full description",
            notes: "test notes"
          }
        },
        physics: {
          mechanics: {
            title: "Point mechanics",
            description: "Course and exercises on kinematics and dynamics",
            fullDescription: "Complete study of point mechanics: reference frames, velocity, acceleration, forces and Newton's theorems.",
            notes: "Progressive exercises with detailed corrections"
          },
          electromagnetism: {
            title: "Electromagnetism",
            description: "Maxwell's equations and applications",
            fullDescription: "Study of electric and magnetic fields, Maxwell's equations and applications in electrostatics and magnetostatics.",
            notes: "Theory and practical applications"
          }
        },
        chemistry: {
          equilibrium: {
            title: "Chemical equilibria",
            description: "Equilibrium constants and shifts",
            fullDescription: "Study of chemical equilibria, calculation of equilibrium constants and Le Chatelier's law.",
            notes: "Calculation methods and concrete examples"
          },
          kinetics: {
            title: "Chemical kinetics",
            description: "Reaction rate and mechanisms",
            fullDescription: "Study of the rate of chemical reactions, reaction orders and reaction mechanisms.",
            notes: "Experimental and theoretical approach"
          }
        }
      }
    },
    methodology: {
      title: "My Teaching Method",
      item1: {
        title: "Sharing Passion",
        description: "I firmly believe that excelling in a discipline is much easier when you love it. That's why I focus on transmitting my passion for science as much as my knowledge."
      },
      item2: {
        title: "Listening & Personalization",
        description: "Every student is unique. I listen carefully to my students to adapt my teaching to their profile, their difficulties and their personal goals."
      },
      item3: {
        title: "Caring Approach",
        description: "As a young student fresh out of prep school, I understand the challenges my students face. I offer caring guidance that builds confidence and helps project success."
      }
    },
    contact: {
      title: "Contact Me",
      email: "Email",
      levels: "Teaching Levels",
      levelsDescription: "From Sophomore to Prep School (1st & 2nd year)",
      followMe: "Follow Me"
    },
    footer: {
      rights: "All rights reserved"
    }
  }
}`

    // Écrire le nouveau fichier
    await fs.writeFile(translationsPath, newContent, 'utf8')
    console.log('✅ Fichier translations.js corrigé et sauvegardé')

    console.log('\n🧪 Test du nouveau fichier...')

    // Tester que le nouveau fichier est valide
    const resourceParser = require('./src/main/services/resourceParser')
    const newFileContent = await fs.readFile(translationsPath, 'utf8')

    try {
      const translations = resourceParser.extractTranslationsFromFile(newFileContent)
      console.log('✅ Extraction réussie')
      console.log('   FR exercises:', Object.keys(translations?.fr?.resources?.exercises || {}))
      console.log('   EN exercises:', Object.keys(translations?.en?.resources?.exercises || {}))

      if (translations?.fr?.resources?.exercises?.maths?.interro0LLG) {
        console.log('✅ Ressource existante trouvée:', translations.fr.resources.exercises.maths.interro0LLG.title)
      }

    } catch (error) {
      console.error('❌ Erreur lors du test:', error.message)
      console.log('   Restauration de la sauvegarde...')
      await fs.copy(backupPath, translationsPath)
      console.log('   Sauvegarde restaurée')
      process.exit(1)
    }

    console.log('\n🎉 Fichier translations.js corrigé avec succès !')
    console.log('\nMaintenant vous pouvez tester:')
    console.log('   node test-translations.js')
    console.log('   npm start')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

fixTranslationsFile()