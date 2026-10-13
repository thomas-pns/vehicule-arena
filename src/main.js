import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar"><a class="brand" href="#">VÉHICULE <span>ARENA</span></a><div class="top-actions"><span class="status"><i></i> PRÊT À JOUER</span><button class="icon-button" id="sound-toggle" aria-label="Activer ou couper le son">♪</button></div></header>
    <section class="layout">
      <aside class="panel menu-panel">
        <div class="eyebrow">ARCADE COMBAT • 3D</div><h1>PRENDS LE<br><em>VOLANT.</em></h1><p class="lead">Entre dans l’arène. Repère ta cible. Fais feu.</p>
        <div class="mode-tabs"><button class="mode-tab active" data-mode="bot">CONTRE UN BOT</button><button class="mode-tab" data-mode="lan">AVEC UN AMI</button></div>
        <div class="bot-options" id="bot-options"><label for="bot-difficulty">NIVEAU DU BOT</label><select id="bot-difficulty"><option value="easy">Recrue</option><option value="normal" selected>Pilote confirmé</option><option value="hard">As de l’arène</option></select></div>
        <div class="lan-options hidden" id="lan-options"><label for="room-code">CODE SALON</label><div class="room-row"><input id="room-code" maxlength="5" placeholder="ABCDE" autocomplete="off"><button class="secondary-button" id="join-room">REJOINDRE</button></div><button class="primary-button" id="create-room">CRÉER UN SALON</button><p class="hint" id="lan-hint">Même Wi-Fi : scanne le QR code du PC hôte ou ouvre son lien local.</p><div id="share-box" class="share-box hidden"></div></div>
        <button class="primary-button" id="play-button">LANCER LA PARTIE <span>→</span></button>
        <div class="controls-card"><div class="controls-title">COMMANDES</div><div class="key-row"><kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd><span>ou</span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><b>SE DÉPLACER</b></div><div class="key-row"><kbd>ESPACE</kbd><b>TIRER</b></div><div class="mobile-hint">Sur téléphone : joystick à gauche, bouton FEU à droite.</div></div>
      </aside>
      <section class="game-panel"><div class="game-top"><div><span class="eyebrow">ARÈNE 01</span><h2>DOCKS DE NÉON</h2></div><div class="scoreboard"><div><small>JOUEUR</small><b id="player-score">0</b></div><span>:</span><div><small>BOT</small><b id="bot-score">0</b></div></div></div>
        <div class="viewport-wrap"><div id="viewport" aria-label="Arène 3D Véhicule Arena"></div><div class="hud"><div class="health-card"><span>VOTRE BLINDAGE</span><div class="health-track"><i id="player-health"></i></div></div><div class="health-card enemy-health"><span id="enemy-label">BLINDAGE BOT</span><div class="health-track"><i id="bot-health"></i></div></div></div><div class="game-message hidden" id="game-message"></div><div class="touch-controls" id="touch-controls"><div class="joystick" id="joystick"><div class="joystick-knob" id="joystick-knob"></div></div><button class="fire-button" id="fire-button">FEU</button></div><div class="loading-message hidden" id="loading-message">Chargement de l’arène 3D…</div></div><footer class="game-footer"><span id="game-status">PRÊT • CHOISIS UN MODE POUR COMMENCER</span><span>PREMIER À 3 POINTS</span></footer></section>
    </section>
    <footer class="page-footer"><span>VÉHICULE ARENA</span><span>JOUE EN GRAND. JOUE ENSEMBLE.</span></footer>
  </main>`;

const $ = (selector) => document.querySelector(selector);
const viewport = $('#viewport');
const loading = $('#loading-message');
const statusLabel = $('#game-status');
const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (isTouch) $('#touch-controls').classList.add('visible');

let renderer, scene, camera, clock;
let player, bot, arenaGroup;
let running = false;
let gameMode = 'bot';
let playerScore = 0, botScore = 0;
let playerHealth = 100, botHealth = 100;
let keys = new Set();
let touchMove = { x: 0, z: 0, firing: false };
let projectiles = [];
let animationFrame = 0;
let roomSocket = null;
let roomCode = '';
let roomRole = 0;
let remotePlayer = null;
let remoteHealth = 100;
let lastRemoteShot = 0;
let reconnectTimer = 0;
const ARENA = 15;
const PLAYER_SPEED = 7.5;
const BOT_SPEED = 5.2;
const clamp = THREE.MathUtils.clamp;

function vehicle(color, accent) {
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.32 });
  const trim = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.25, metalness: 0.55, emissive: accent, emissiveIntensity: 0.18 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.58, 2.25), paint);
  body.position.y = 0.58; body.castShadow = true; root.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.2, 0.92), trim);
  hood.position.set(0, 0.88, -0.38); hood.castShadow = true; root.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.48, 0.86), new THREE.MeshStandardMaterial({ color: 0x16354b, roughness: 0.17, metalness: 0.42, transparent: true, opacity: 0.9 }));
  cabin.position.set(0, 0.96, 0.28); cabin.castShadow = true; root.add(cabin);
  for (const x of [-0.58, 0.58]) for (const z of [-0.72, 0.72]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.22, 12), dark);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.36, z); wheel.castShadow = true; root.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.235, 10), trim);
    hub.rotation.z = Math.PI / 2; hub.position.set(x * 1.02, 0.36, z); root.add(hub);
  }
  for (const x of [-0.48, 0.48]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xbdf7ff }));
    lamp.position.set(x, 0.64, -1.14); root.add(lamp);
  }
  const gun = new THREE.Group(); gun.position.set(0, 0.96, -0.15); root.add(gun);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.2, 12), trim); base.castShadow = true; gun.add(base);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 12), dark); barrel.rotation.x = Math.PI / 2; barrel.position.z = -0.48; barrel.castShadow = true; gun.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12), trim); muzzle.rotation.x = Math.PI / 2; muzzle.position.z = -0.94; gun.add(muzzle);
  root.userData.gun = gun;
  root.userData.velocity = new THREE.Vector3();
  root.userData.lastDirection = new THREE.Vector3(0, 0, -1);
  root.userData.health = 100;
  return root;
}

function addBox(parent, x, z, sx, sy, sz, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.75, metalness: opts.metalness ?? 0.08 }));
  mesh.position.set(x, sy / 2, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  if (opts.glow) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.82, 0.08, 0.03), new THREE.MeshBasicMaterial({ color: opts.glow }));
    strip.position.set(x, sy * 0.66, z - sz / 2 - 0.025); parent.add(strip);
  }
  return mesh;
}

function init3D() {
  loading.classList.remove('hidden');
  try {
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x09121e); scene.fog = new THREE.Fog(0x09121e, 24, 58);
    camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
    renderer = new THREE.WebGLRenderer({ antialias: !isTouch, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
    renderer.shadowMap.enabled = !isTouch; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    viewport.replaceChildren(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0x9acbff, 0x17202d, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffe2bd, 3.1); keyLight.position.set(-8, 18, -6); keyLight.castShadow = !isTouch; keyLight.shadow.mapSize.set(1024, 1024); scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x16d9ff, 36, 32); rimLight.position.set(10, 6, 8); scene.add(rimLight);
    arenaGroup = new THREE.Group(); scene.add(arenaGroup);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshStandardMaterial({ color: 0x182536, roughness: 0.83, metalness: 0.16 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; arenaGroup.add(floor);
    const grid = new THREE.GridHelper(36, 36, 0x1bcdf4, 0x26384c); grid.position.y = 0.012; arenaGroup.add(grid);
    for (let i = 0; i < 4; i++) {
      const half = ARENA;
      if (i < 2) addBox(arenaGroup, i === 0 ? -half : half, 0, 0.7, 2.7, 31, 0x263b50, { glow: 0x20d9ff });
      else addBox(arenaGroup, 0, i === 2 ? -half : half, 31, 2.7, 0.7, 0x263b50, { glow: 0x20d9ff });
    }
    addBox(arenaGroup, -5, 0, 1.2, 1.3, 7, 0x35485c, { glow: 0xffa23a });
    addBox(arenaGroup, 5, 0, 1.2, 1.3, 7, 0x35485c, { glow: 0xffa23a });
    addBox(arenaGroup, 0, -5, 7, 1.25, 1.2, 0x35485c, { glow: 0xa35cff });
    addBox(arenaGroup, 0, 5, 7, 1.25, 1.2, 0x35485c, { glow: 0x20d9ff });
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 2.6, 8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x1ad6ff : 0xff5f80, emissive: i % 2 ? 0x087b9e : 0x8c1836, emissiveIntensity: 0.8, metalness: 0.55 }));
      pylon.position.set(Math.cos(angle) * 13, 1.3, Math.sin(angle) * 13); pylon.castShadow = true; arenaGroup.add(pylon);
    }
    player = vehicle(0x19c9f4, 0x83f1ff); player.position.set(-7, 0, 0); scene.add(player);
    bot = vehicle(0xff526c, 0xffb350); bot.position.set(7, 0, 0); scene.add(bot);
    clock = new THREE.Clock(); resizeRenderer(); loading.classList.add('hidden');
    if (!animationFrame) animate();
  } catch (error) {
    console.error('Échec initialisation 3D :', error);
    loading.textContent = 'La 3D ne peut pas démarrer. Essaie un navigateur récent avec l’accélération matérielle activée.';
  }
}
function resizeRenderer() {
  if (!renderer || !camera) return;
  const width = Math.max(1, viewport.clientWidth), height = Math.max(1, viewport.clientHeight);
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
}
window.addEventListener('resize', resizeRenderer);

function resetRound() {
  playerHealth = botHealth = 100;
  player.position.set(-7, 0, 0); bot.position.set(7, 0, 0);
  player.rotation.y = Math.PI / 2; bot.rotation.y = -Math.PI / 2;
  player.userData.velocity.set(0, 0, 0); bot.userData.velocity.set(0, 0, 0);
  for (const p of projectiles) { scene.remove(p.mesh); }
  projectiles = [];
  updateHud();
}
function updateHud() {
  $('#player-health').style.width = `${playerHealth}%`; $('#bot-health').style.width = `${botHealth}%`;
  $('#player-score').textContent = playerScore; $('#bot-score').textContent = botScore;
}
function startGame() {
  if (!renderer) init3D();
  if (!player || !bot) return;
  running = true; playerScore = 0; botScore = 0; resetRound();
  $('#game-message').classList.add('hidden');
  statusLabel.textContent = gameMode === 'bot' ? 'COMBAT • CONTRE LE BOT' : `SALLE ${roomCode || ''} • EN ATTENTE DU JOUEUR`;
  if (gameMode === 'lan') connectRoom();
  viewport.focus?.();
}
function moveEntity(entity, direction, speed, dt) {
  const velocity = entity.userData.velocity;
  const desired = direction.clone(); if (desired.lengthSq() > 1) desired.normalize();
  const accel = desired.lengthSq() ? 30 : 21;
  velocity.x += (desired.x * speed - velocity.x) * (1 - Math.exp(-accel * dt));
  velocity.z += (desired.z * speed - velocity.z) * (1 - Math.exp(-accel * dt));
  entity.position.x += velocity.x * dt; entity.position.z += velocity.z * dt;
  entity.position.x = clamp(entity.position.x, -ARENA + 1.25, ARENA - 1.25); entity.position.z = clamp(entity.position.z, -ARENA + 1.25, ARENA - 1.25);
  const desiredFacing = desired.lengthSq() > 0.02 ? Math.atan2(-desired.x, -desired.z) : null;
  if (desiredFacing !== null) { let diff = desiredFacing - entity.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); entity.rotation.y += diff * (1 - Math.exp(-10 * dt)); entity.userData.lastDirection.set(-Math.sin(entity.rotation.y), 0, -Math.cos(entity.rotation.y)); }
}
function shoot(shooter, target, isPlayer) {
  const now = performance.now(); if (now - (shooter.userData.lastShot || 0) < (isPlayer ? 360 : 640)) return;
  shooter.userData.lastShot = now;
  const direction = target ? target.position.clone().sub(shooter.position) : shooter.userData.lastDirection.clone(); direction.y = 0;
  if (direction.lengthSq() < 0.001) return; direction.normalize();
  shooter.userData.gun.rotation.y = Math.atan2(-direction.x, -direction.z) - shooter.rotation.y;
  const color = isPlayer ? 0x68f2ff : 0xff7183;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), new THREE.MeshBasicMaterial({ color }));
  mesh.position.copy(shooter.position).add(new THREE.Vector3(0, 0.95, 0)).addScaledVector(direction, 1.15); scene.add(mesh);
  projectiles.push({ mesh, velocity: direction.multiplyScalar(isPlayer ? 19 : 15), owner: shooter, damage: 18, life: 2.2 });
}
function botInput(dt) {
  const delta = player.position.clone().sub(bot.position); delta.y = 0; const distance = delta.length(); const direction = delta.normalize(); const move = new THREE.Vector3();
  if (distance > 7) move.copy(direction); else if (distance < 4.5) move.copy(direction).negate(); else { const side = new THREE.Vector3(-direction.z, 0, direction.x); move.copy(side).multiplyScalar(Math.sin(performance.now() / 1100) >= 0 ? 1 : -1); }
  if (distance > 0.001) { const aim = Math.atan2(-direction.x, -direction.z); let diff = aim - bot.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); bot.rotation.y += diff * (1 - Math.exp(-5 * dt)); bot.userData.lastDirection.set(-Math.sin(bot.rotation.y), 0, -Math.cos(bot.rotation.y)); if (distance < 14) shoot(bot, player, false); }
  return move;
}
function tickProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; p.life -= dt; p.mesh.position.addScaledVector(p.velocity, dt);
    const target = p.owner === player ? (gameMode === 'lan' ? remotePlayer : bot) : player;
    const hit = target && p.mesh.position.distanceTo(new THREE.Vector3(target.position.x, 0.8, target.position.z)) < 1.0;
    if (!hit && (Math.abs(p.mesh.position.x) > ARENA || Math.abs(p.mesh.position.z) > ARENA)) p.life = 0;
    if (hit && running) {
      if (target === player) playerHealth = Math.max(0, playerHealth - p.damage);
      else if (gameMode === 'lan') { remoteHealth = Math.max(0, remoteHealth - p.damage); }
      else botHealth = Math.max(0, botHealth - p.damage);
      target.userData.velocity?.addScaledVector(p.velocity, 0.22); p.life = 0; updateHud();
      if (gameMode === 'bot' && target === player && playerHealth <= 0) endRound(false);
      if (gameMode === 'bot' && target === bot && botHealth <= 0) endRound(true);
    }
    if (p.life <= 0) { scene.remove(p.mesh); projectiles.splice(i, 1); }
  }
}
function endRound(playerWon) {
  if (!running) return; running = false;
  if (playerWon) playerScore++; else botScore++; updateHud();
  const winner = playerScore >= 3 || botScore >= 3; const message = $('#game-message');
  message.textContent = winner ? (playerScore >= 3 ? 'VICTOIRE !' : 'LE BOT GAGNE') : (playerWon ? 'ÉLIMINATION !' : 'VÉHICULE DÉTRUIT'); message.classList.remove('hidden');
  statusLabel.textContent = winner ? 'MATCH TERMINÉ' : 'MANCHE TERMINÉE • RELANCE POUR CONTINUER';
  if (!winner && gameMode === 'bot') window.setTimeout(() => { if (!running) { resetRound(); running = true; statusLabel.textContent = 'NOUVELLE MANCHE • CONTRE LE BOT'; message.classList.add('hidden'); } }, 1500);
}
function resolveObstacleCollision(entity) {
  const obstacles = arenaGroup.children.filter(o => o.geometry?.type === 'BoxGeometry' && o.geometry.parameters?.height > 0.5);
  for (const box of obstacles) {
    const { width, depth } = box.geometry.parameters;
    const minX = box.position.x - width / 2 - .7, maxX = box.position.x + width / 2 + .7, minZ = box.position.z - depth / 2 - .7, maxZ = box.position.z + depth / 2 + .7;
    if (entity.position.x > minX && entity.position.x < maxX && entity.position.z > minZ && entity.position.z < maxZ) {
      const exits = [entity.position.x - minX, maxX - entity.position.x, entity.position.z - minZ, maxZ - entity.position.z], nearest = exits.indexOf(Math.min(...exits));
      if (nearest === 0) entity.position.x = minX; else if (nearest === 1) entity.position.x = maxX; else if (nearest === 2) entity.position.z = minZ; else entity.position.z = maxZ;
      entity.userData.velocity.multiplyScalar(.45);
    }
  }
}
function updateRemote(data) {
  if (!remotePlayer) { remotePlayer = vehicle(0xff526c, 0xffb350); scene.add(remotePlayer); }
  remotePlayer.position.set(clamp(Number(data.x) || 0, -ARENA + 1.25, ARENA - 1.25), 0, clamp(Number(data.z) || 0, -ARENA + 1.25, ARENA - 1.25));
  remotePlayer.rotation.y = Number(data.yaw) || 0;
  remoteHealth = Number.isFinite(data.health) ? data.health : remoteHealth;
  $('#bot-health').style.width = `${remoteHealth}%`; $('#bot-score').textContent = Number(data.score) || 0;
  if (data.fire && performance.now() - lastRemoteShot > 220) { lastRemoteShot = performance.now(); shoot(remotePlayer, player, false); }
}
function animate() {
  animationFrame = requestAnimationFrame(animate); if (!renderer || !scene || !camera || !player || !bot) return;
  const dt = Math.min(clock.getDelta(), .05);
  if (running) {
    if (gameMode !== 'lan' || roomRole === 1) {
      const direction = new THREE.Vector3((keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('q') || keys.has('arrowleft') ? 1 : 0), 0, (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('z') || keys.has('arrowup') ? 1 : 0));
      direction.add(new THREE.Vector3(touchMove.x, 0, touchMove.z)); moveEntity(player, direction, PLAYER_SPEED, dt);
      if (keys.has(' ') || touchMove.firing) shoot(player, gameMode === 'lan' ? remotePlayer : bot, true);
    }
    if (gameMode === 'bot') moveEntity(bot, botInput(dt), BOT_SPEED, dt);
    if (gameMode === 'lan') { if (roomRole === 2 && remotePlayer) moveEntity(bot, new THREE.Vector3(), 0, dt); }
    resolveObstacleCollision(player); if (gameMode === 'bot') resolveObstacleCollision(bot);
    tickProjectiles(dt);
  }
  const target = player.position.clone(), behind = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
  const desiredCamera = target.clone().addScaledVector(behind, 8.8).add(new THREE.Vector3(0, 6.2, 0)); camera.position.lerp(desiredCamera, 1 - Math.exp(-4.2 * dt)); camera.lookAt(target.clone().add(new THREE.Vector3(0, 1.1, 0)));
  renderer.render(scene, camera);
}
window.addEventListener('keydown', event => { const key = event.key.toLowerCase(); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault(); keys.add(key); });
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase())); window.addEventListener('blur', () => keys.clear());
$('#play-button').addEventListener('click', startGame);
document.querySelectorAll('.mode-tab').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.toggle('active', tab === button)); gameMode = button.dataset.mode; $('#bot-options').classList.toggle('hidden', gameMode !== 'bot'); $('#lan-options').classList.toggle('hidden', gameMode !== 'lan'); $('#play-button').classList.toggle('hidden', gameMode === 'lan'); $('#enemy-label').textContent = gameMode === 'bot' ? 'BLINDAGE BOT' : 'BLINDAGE ADVERSAIRE'; }));
$('#sound-toggle').addEventListener('click', e => e.currentTarget.classList.toggle('muted'));
const joystick = $('#joystick'), knob = $('#joystick-knob'); let joystickPointer = null;
joystick.addEventListener('pointerdown', event => { joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); updateJoystick(event); }); joystick.addEventListener('pointermove', event => { if (event.pointerId === joystickPointer) updateJoystick(event); });
function updateJoystick(event) { const rect = joystick.getBoundingClientRect(), radius = rect.width * .34; const dx = event.clientX - (rect.left + rect.width / 2), dy = event.clientY - (rect.top + rect.height / 2); const length = Math.min(radius, Math.hypot(dx, dy)), angle = Math.atan2(dy, dx); const x = Math.cos(angle) * length, y = Math.sin(angle) * length; knob.style.transform = `translate(${x}px, ${y}px)`; touchMove.x = x / radius; touchMove.z = y / radius; }
function releaseJoystick(event) { if (event.pointerId !== joystickPointer) return; joystickPointer = null; touchMove.x = touchMove.z = 0; knob.style.transform = 'translate(0, 0)'; }
joystick.addEventListener('pointerup', releaseJoystick); joystick.addEventListener('pointercancel', releaseJoystick);
const fireButton = $('#fire-button'); fireButton.addEventListener('pointerdown', e => { e.preventDefault(); touchMove.firing = true; fireButton.setPointerCapture(e.pointerId); }); for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) fireButton.addEventListener(name, () => touchMove.firing = false);
function setLanHint(text) { $('#lan-hint').textContent = text; }
function connectRoom(action = 'join') {
  if (roomSocket?.readyState === WebSocket.OPEN) return;
  const socketUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`; roomSocket = new WebSocket(socketUrl);
  roomSocket.onopen = () => { clearTimeout(reconnectTimer); roomSocket.send(JSON.stringify({ type: action, code: roomCode })); setLanHint(`Connexion au salon ${roomCode}…`); };
  roomSocket.onmessage = event => { let packet; try { packet = JSON.parse(event.data); } catch { return; }
    if (packet.type === 'room') { roomCode = packet.code; roomRole = packet.player; setLanHint(packet.count === 2 ? `Salon ${roomCode} • adversaire connecté.` : `Salon ${roomCode} • en attente de l’ami. Partage le lien local ou le code.`); }
    if (packet.type === 'peer') { setLanHint(packet.connected ? 'Adversaire connecté. La partie amicale peut commencer !' : 'Adversaire déconnecté. En attente de reconnexion…'); }
    if (packet.type === 'state' && packet.player) updateRemote(packet.player);
    if (packet.type === 'error') setLanHint(packet.message || 'Connexion au salon impossible.');
  };
  roomSocket.onclose = () => { if (running && gameMode === 'lan') reconnectTimer = window.setTimeout(() => connectRoom(action), 1800); };
  roomSocket.onerror = () => setLanHint('Serveur local inaccessible. Ouvre le jeu via le lien affiché par le PC hôte.');
}
let networkSendAt = 0;
function sendRoomState() { if (gameMode !== 'lan' || roomSocket?.readyState !== WebSocket.OPEN || !player || !running) return; const now = performance.now(); const packet = { type: 'state', code: roomCode, player: { x: player.position.x, z: player.position.z, yaw: player.rotation.y, health: playerHealth, score: playerScore, fire: touchMove.firing || keys.has(' ') } }; roomSocket.send(JSON.stringify(packet)); networkSendAt = now; }
window.setInterval(sendRoomState, 50);
$('#create-room').addEventListener('click', () => { roomCode = Math.random().toString(36).slice(2, 7).toUpperCase(); $('#room-code').value = roomCode; gameMode = 'lan'; roomRole = 1; startGame(); const shareUrl = `${location.origin}${location.pathname}?room=${roomCode}`; const box = $('#share-box'); box.classList.remove('hidden'); const link = document.createElement('a'); link.href = shareUrl; link.textContent = shareUrl; link.target = '_blank'; link.rel = 'noopener'; const qr = document.createElement('img'); qr.alt = 'QR code pour rejoindre cette partie'; qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`; box.replaceChildren(qr, link); connectRoom('create'); });
$('#join-room').addEventListener('click', () => { roomCode = $('#room-code').value.trim().toUpperCase(); if (!/^[A-Z0-9]{5}$/.test(roomCode)) { setLanHint('Entre un code de salon valide à 5 caractères.'); return; } gameMode = 'lan'; roomRole = 2; startGame(); connectRoom('join'); });
const urlRoom = new URLSearchParams(location.search).get('room'); if (urlRoom && /^[A-Z0-9]{5}$/i.test(urlRoom)) { gameMode = 'lan'; $('#room-code').value = urlRoom.toUpperCase(); document.querySelector('[data-mode="lan"]').click(); }
init3D();
