# Véhicule Arena

Prototype de jeu d'arène 3D arcade, créé dans un nouveau dépôt. Ce premier jalon propose un duel jouable contre un bot : caméra troisième personne derrière et au-dessus du véhicule, déplacement libre, tirs, dégâts, éliminations, score, réapparition et trois configurations d'arène. Une interface tactile de déplacement et de tir est incluse.

## Lancer en local

Prérequis : Node.js 20 LTS ou supérieur.

```bash
npm install
npm run dev
```

Vite affiche une adresse locale. Pour un téléphone ou un autre ordinateur sur le même Wi-Fi, ouvrez `http://IP_DU_PC:5173` depuis l'appareil. Autorisez Node.js/Vite dans le pare-feu Windows si nécessaire.

Build :

```bash
npm run build
```

## Commandes provisoires

- ZQSD, WASD ou flèches : déplacement libre.
- Clic maintenu ou Espace : tirer vers le dernier adversaire visé.
- Mobile : joystick de déplacement et bouton FIRE ; le tir vise automatiquement l'adversaire.

La visée à la souris et la visée tactile manuelle ne sont pas encore disponibles. Le tir vise automatiquement l'adversaire dans ce jalon.

## État du prototype

Le mode contre un bot est implémenté côté client. Trois arènes sont sélectionnables avant la partie. Le combat continue avec score et réapparitions. Le mode salle réseau n'est pas encore implémenté : son bouton est volontairement désactivé. La prochaine étape sera d'ajouter un serveur local lancé sur le PC hôte, rejoignable sur le réseau local. Il n'y a pas encore d'hébergement public, de classement, de bonus ou de comptes.

## Stack et ressources

- Three.js pour le rendu 3D, Vite pour le serveur de développement et le build.
- Véhicules, arènes, matériaux, éclairage et effets sont générés par le code ; aucune image ou son tiers embarqué.
- La police de l'interface est chargée via Google Fonts (Barlow Condensed et Inter), avec polices système de secours.