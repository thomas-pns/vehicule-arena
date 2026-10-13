# Véhicule Arena

Prototype de combat 3D en arène : caméra troisième personne, conduite, tirs, bot et salle amicale LAN. Interface adaptée aux ordinateurs, tablettes et téléphones tactiles.

## Lancer sur Windows

1. Installer Node.js LTS.
2. Dans PowerShell, depuis le dossier du projet :

```powershell
npm install
npm start
```

Le jeu s'ouvre sur `http://localhost:3000`. Le serveur affiche également une ou plusieurs URL `Réseau local` comme `http://192.168.1.24:3000` : c'est le lien à ouvrir sur les téléphones connectés au même Wi-Fi. Il n'est pas nécessaire de saisir une adresse de serveur dans le jeu. Si Windows demande une autorisation Pare-feu, autoriser Node.js sur les réseaux privés. Le réseau doit permettre la communication entre appareils (désactiver l'isolation des clients/du Wi-Fi invité).

Pour développer, utilisez `npm run dev` puis ouvrez l'URL indiquée par Vite; pour le test multi-appareils, préférez `npm start`.

## Commandes

Clavier : ZQSD ou WASD / flèches pour bouger, Espace pour tirer. Écran tactile : joystick virtuel et bouton FEU. Utiliser le menu pour lancer le bot ou créer/rejoindre un salon amical.

## Connexion entre appareils

Le PC hôte exécute le serveur avec `npm start`. Sur les autres appareils du même réseau, ouvrir l'URL locale affichée dans PowerShell (ou scanner le QR code fourni lors de la création d'un salon). Le client se connecte automatiquement au WebSocket sur la même origine; aucun champ d'adresse de serveur n'est nécessaire. Le pare-feu Windows doit autoriser les connexions entrantes sur le réseau privé.

> Le LAN est un prototype de synchronisation de positions. Il n'y a pas encore de simulation autoritative, de synchronisation robuste des dégâts/score, ni de sécurité contre la triche; le mode bot est le mode de jeu complet actuellement visé.
