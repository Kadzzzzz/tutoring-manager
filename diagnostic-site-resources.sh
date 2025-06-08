#!/bin/bash

# diagnostic-site-resources.sh
# Diagnostic complet du problème d'affichage des ressources sur le site

echo "🔍 DIAGNOSTIC: Nouvelles ressources ne s'affichent pas sur le site"
echo "=================================================================="

# 1. Vérifier les fichiers du projet web
echo -e "\n📁 1. VÉRIFICATION STRUCTURE PROJET WEB"
echo "----------------------------------------"

WEB_PROJECT_PATH=~/jeremy-teacher

echo "Chemin du projet web: $WEB_PROJECT_PATH"
if [ -d "$WEB_PROJECT_PATH" ]; then
    echo "✅ Dossier projet web existe"

    echo -e "\n📄 App.vue existe:"
    if [ -f "$WEB_PROJECT_PATH/src/App.vue" ]; then
        echo "✅ $WEB_PROJECT_PATH/src/App.vue"
        echo "Taille: $(wc -l < "$WEB_PROJECT_PATH/src/App.vue") lignes"
    else
        echo "❌ App.vue introuvable"
    fi

    echo -e "\n📄 translations.js existe:"
    if [ -f "$WEB_PROJECT_PATH/src/utils/translations.js" ]; then
        echo "✅ $WEB_PROJECT_PATH/src/utils/translations.js"
        echo "Taille: $(wc -l < "$WEB_PROJECT_PATH/src/utils/translations.js") lignes"
    else
        echo "❌ translations.js introuvable"
    fi

    echo -e "\n📁 PDFs existent:"
    PDF_DIR="$WEB_PROJECT_PATH/public/pdfs"
    if [ -d "$PDF_DIR" ]; then
        echo "✅ Dossier PDFs: $PDF_DIR"
        echo "Nombre de PDFs: $(find "$PDF_DIR" -name "*.pdf" | wc -l)"
        echo "Derniers PDFs ajoutés:"
        find "$PDF_DIR" -name "*.pdf" -printf "%T@ %p\n" | sort -n | tail -5 | while read timestamp file; do
            date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S" | tr -d '\n'
            echo " - $(basename "$file")"
        done
    else
        echo "❌ Dossier PDFs introuvable"
    fi

else
    echo "❌ ERREUR: Dossier projet web introuvable à $WEB_PROJECT_PATH"
    echo "Vérifiez le chemin dans fileService.js"
fi

# 2. Vérifier les dernières ressources ajoutées dans App.vue
echo -e "\n📋 2. RESSOURCES DANS APP.VUE"
echo "------------------------------"

if [ -f "$WEB_PROJECT_PATH/src/App.vue" ]; then
    echo "Dernières ressources ajoutées dans App.vue:"
    grep -n "id: '" "$WEB_PROJECT_PATH/src/App.vue" | tail -10 | while read line; do
        echo "  $line"
    done

    echo -e "\nRecherche de 'test' dans App.vue:"
    grep -n "test" "$WEB_PROJECT_PATH/src/App.vue" || echo "❌ Aucune ressource 'test' trouvée"
else
    echo "❌ Impossible de lire App.vue"
fi

# 3. Vérifier les traductions
echo -e "\n📝 3. TRADUCTIONS DANS TRANSLATIONS.JS"
echo "--------------------------------------"

if [ -f "$WEB_PROJECT_PATH/src/utils/translations.js" ]; then
    echo "Dernières traductions ajoutées:"
    grep -A3 -B1 "test" "$WEB_PROJECT_PATH/src/utils/translations.js" || echo "❌ Aucune traduction 'test' trouvée"

    echo -e "\nStructure des traductions (dernières lignes):"
    tail -20 "$WEB_PROJECT_PATH/src/utils/translations.js"
else
    echo "❌ Impossible de lire translations.js"
fi

# 4. Vérifier si le site web fonctionne
echo -e "\n🌐 4. ÉTAT DU SITE WEB"
echo "---------------------"

if [ -d "$WEB_PROJECT_PATH" ]; then
    cd "$WEB_PROJECT_PATH"

    echo "Package.json existe: $([ -f package.json ] && echo "✅" || echo "❌")"
    echo "Node_modules existe: $([ -d node_modules ] && echo "✅" || echo "❌")"

    if [ -f package.json ]; then
        echo "Scripts disponibles dans package.json:"
        grep -A10 '"scripts"' package.json | grep -E '"(dev|serve|build)"'
    fi

    echo -e "\nPour tester le site web:"
    echo "cd $WEB_PROJECT_PATH"
    echo "npm run dev  # ou npm run serve"
    echo "Puis ouvrir http://localhost:3000 (ou le port affiché)"
fi

# 5. Vérifier les logs d'erreur récents
echo -e "\n📜 5. LOGS ET ERREURS"
echo "--------------------"

MANAGER_PATH=~/Documents/tutoring-manager

echo "Dernières modifications dans tutoring-manager:"
find "$MANAGER_PATH" -name "*.js" -printf "%T@ %p\n" | sort -n | tail -5 | while read timestamp file; do
    date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S" | tr -d '\n'
    echo " - $(basename "$file")"
done

# 6. Résumé et suggestions
echo -e "\n🎯 6. RÉSUMÉ ET SUGGESTIONS"
echo "============================"

echo -e "\n✅ À VÉRIFIER:"
echo "1. Le projet web jeremy-teacher existe et contient App.vue + translations.js"
echo "2. Les nouvelles ressources sont bien ajoutées dans App.vue"
echo "3. Les traductions correspondantes sont ajoutées dans translations.js"
echo "4. Les PDFs sont copiés dans public/pdfs/"
echo "5. Le site web démarre sans erreur avec 'npm run dev'"

echo -e "\n🛠️ ACTIONS À TENTER:"
echo "1. cd $WEB_PROJECT_PATH && npm run dev"
echo "2. Vérifier la console du navigateur pour erreurs JS"
echo "3. Inspecter l'élément pour voir si les nouvelles ressources sont dans le DOM"
echo "4. Vérifier que le filtre/recherche ne cache pas les nouvelles ressources"

echo -e "\n📞 POUR DEBUG APPROFONDI:"
echo "1. Ouvrir DevTools sur le site web (F12)"
echo "2. Aller dans Console et vérifier les erreurs"
echo "3. Aller dans Network et voir si les fichiers se chargent"
echo "4. Aller dans Elements et chercher les nouvelles ressources dans le HTML"

echo -e "\n🎉 Ce diagnostic est terminé !"