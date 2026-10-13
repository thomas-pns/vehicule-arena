# Véhicule Arena

Prototype 3D de combat de véhicules : mode bot et salles amicales sur réseau local.

## Prérequis

- Node.js LTS (Node 20 ou 22)
- npm

## Installation et lancement sous Windows

Depuis PowerShell, dans le dossier du dépôt :

```powershell
npm install
npm start
```

`npm start` construit le client puis démarre le serveur HTTP et WebSocket. Le jeu est servi à l'adresse `http://localhost:3000` (sauf indication différente affichée par le serveur). Pour lancer uniquement le serveur après avoir construit le client : `npm run server`.

Si npm indique qu'il manque `ws`, vérifiez que vous êtes sur la branche `feature/core-gameplay-lan`, puis récupérez les dernières modifications et réinstallez les dépendances :

```powershell
git pull
npm install
npm start
```

## Jouer avec un ami sur le même réseau Wi-Fi/LAN

1. Lancez le serveur sur le PC hôte avec `npm start`.
2. Autorisez Node.js sur les réseaux privés dans la fenêtre du pare-feu Windows (ou créez une règle entrante pour le port 3000).
3. Trouvez l'adresse IPv4 du PC hôte avec `ipconfig`.
4. Sur l'autre appareil du même réseau, ouvrez `http://ADRESSE_IPV4_DU_PC:3000`.
5. Créez ou rejoignez une salle depuis le menu du jeu.

Les appareils doivent être sur le même réseau local. Les connexions entre réseaux différents et l'hébergement public ne sont pas pris en charge à ce stade.

## Développement

```powershell
npm run dev
```

Vite lance le client en mode développement. Les parties LAN nécessitent également le serveur (`npm run server`) ; utilisez l'adresse/port du serveur configurés par l'application.

## État du prototype

Le jeu et le mode LAN sont en cours de développement. Le relais réseau doit encore être vérifié avec deux appareils avant d'être considéré comme validé de bout en bout.
