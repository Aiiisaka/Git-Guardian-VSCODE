#!/bin/bash

# Variables d'environnement pour les seuils
MAX_FILES_MODIFIED_OR_UNTRACKED=10
MAX_LINES_MODIFIED=100

# Fonction pour vérifier le statut des fichiers
check_files() {
    files_modified=$(git diff --name-only | wc -l)
    lines_modified=$(git diff | grep "^+" | wc -l)
    untracked_files=$(git ls-files -o | wc -l)
    files_modified_or_untracked=$(($files_modified + $untracked_files))

    if [ "$files_modified_or_untracked" -ge $MAX_FILES_MODIFIED_OR_UNTRACKED ] || [ "$lines_modified" -ge $MAX_LINES_MODIFIED ]; then
        echo "ALERT"
        return 1
    else
        echo "OK"
    fi

    return 0
}

# Vérification de l'installation de Git
if ! command -v git &> /dev/null; then
    echo "GIT_NOT_INSTALLED"
    exit 1
fi

check_files