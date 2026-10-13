# Véhicule Arena

Prototype de jeu d'arène 3D cartoon/arcade, créé dans un nouveau dépôt. Le premier jalon est un duel jouable contre un bot : caméra à la troisième personne derrière et au-dessus du véhicule, déplacement libre, tir, dégâts, éliminations, score, réapparition et trois configurations d'arène. Une interface tactile rudimentaire est également présente pour mobile.

## Lancer en local

Prérequis : Node.js 20 LTS ou supérieur.

```bash
npm install
npm run dev
```

Vite affiche une adresse locale. Ouvrez-la dans un navigateur récent. Pour un téléphone ou un autre ordinateur sur le même Wi-Fi, le serveur Vite écoute sur le réseau (`--host 0.0.0.0`) : ouvrez `http://IP_DU_PC:5173` depuis l'appareil. Autorisez Node.js/Vite dans le pare-feu Windows si nécessaire.

Build de vérification :

```bash
npm run build
```

## Commandes

- ZQSD ou WASD / flèches : déplacement libre.
- Souris : orienter le canon et viser (ordinateur).
- Clic maintenu ou Espace : tirer.
- Écran tactile : joystick de déplacement et bouton FIRE. La visée tactile est encore automatique/à améliorer.

## État du prototype

Le mode contre un bot est implémenté côté client. Les trois arènes sont sélectionnables avant de lancer la partie. La partie se poursuit avec score et réapparitions. Le mode salle réseau n'est pas encore implémenté dans cette première livraison ; le bouton est volontairement indiqué « bientôt ». Le futur mode ami utilisera un petit serveur local lancé sur le PC hôte, rejoignable sur le réseau local. Ce premier dépôt n'inclut pas de service hébergé, classement, bonus ou compte.

## Stack et ressources

- Three.js pour le rendu 3D, Vite pour le serveur de développement et le build.
- Véhicules, arènes, matériaux, éclairage et effets sont créés par le code ; aucune image ou son tiers embarqué.
- La police d'interface est chargée via Google Fonts (Barlow Condensed et Inter) ; si indisponible, les polices système prennent le relais.
