# Variables d'environnement pour les seuils
$MAX_FILES_MODIFIED_OR_UNTRACKED = 10
$MAX_LINES_MODIFIED = 100

# Fonction pour vérifier le statut des fichiers
function Check_Files {
    $files_modified = (git diff --name-only | Measure-Object -Line).Lines
    $lines_modified = (git diff | Select-String "^+" | Measure-Object -Line).Lines
    $untracked_files = (git ls-files -o | Measure-Object -Line).Lines
    $files_modified_or_untracked = ($files_modified + $untracked_files)

    if ($files_modified_or_untracked -ge $MAX_FILES_MODIFIED_OR_UNTRACKED -or $lines_modified -ge $MAX_LINES_MODIFIED) {
        return Write-Output "ALERT"
    }

    return Write-Output "OK"
}

# Vérification de l'installation de Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Output "GIT_NOT_INSTALLED"
    exit 1
}

Check_Files