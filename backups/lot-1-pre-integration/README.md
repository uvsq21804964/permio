# Sauvegarde avant intégration du lot 1

Date de préparation : 2026-04-18

Contexte :
- intégration des fichiers du lot 1 depuis `refactor-lot-1/` vers leurs
  emplacements réels sous `lib/` ;
- vérification faite avant copie ;
- aucun des fichiers cibles n'existait encore.

Conséquence :
- aucun fichier existant n'a été modifié ni écrasé ;
- il n'y a donc pas de version originale à archiver dans ce dossier pour ce lot.

Fichiers ajoutés lors de l'intégration :
- `lib/api/auth-server.ts`
- `lib/server/domain/time-ranges.ts`
- `lib/server/repositories/agency-repository.ts`
- `lib/server/repositories/user-repository.ts`
