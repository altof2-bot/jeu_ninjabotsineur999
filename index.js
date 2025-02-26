const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// Configuration du bot
const bot = new Telegraf('7853466701:AAH_M4bBj0k1_62mRY0UuszUv39b8rpdqWs');

// Fichier pour sauvegarder les données
const DATA_FILE = 'data.json';

// Variables globales
let players = {};
let teams = {};
let tournoiParticipants = [];
const CREATOR_ID = 5116530698; // ID de @ALTOF2
const CHANNEL_ID = "@sineur_x_bot"; // Canal à suivre
let pending_requests = {};

// Fonction pour vérifier si l'utilisateur est membre du canal
async function checkSubscription(userId, ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.error("Erreur lors de la vérification d'abonnement:", error);
    return false;
  }
}

// Charger les données
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      return {};
    }
  }
  return {};
}

// Sauvegarder les données
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Constantes
const villages = ['Konoha', 'Suna', 'Kiri', 'Iwa', 'Kumo'];
const clans = ['Uchiha', 'Hyuga', 'Senju', 'Nara', 'Akimichi', 'Yamanaka', 'Aburame', 'Inuzuka', 'Uzumaki'];

const jutsus = {
  'Uchiha': ['Sharingan', 'Kaléidoscoptique du sharigan', 'Susanoo', 'Rinngan'],
  'Hyuga': ['Byakugan', 'Gentle Fist', 'Eight Trigrams Palms'],
  'Senju': ['Mokuton'],
  'Nara': ['Kage Mane no Jutsu'],
  'Akimichi': ['Baika no Jutsu', 'Multi-Size Technique'],
  'Yamanaka': ['Shintenshin no Jutsu'],
  'Aburame': ['Kikaichū no Jutsu'],
  'Inuzuka': ['Ninjutsu de l\'Inuzuka'],
  'Uzumaki': ['Fūinjutsu', 'Rasengan', 'Rasen Shuriken']
};

const missions = [
  {name: "Mission de reconnaissance", exp: 100, money: 50, difficulty: 1},
  {name: "Assassinat d'un ennemi", exp: 200, money: 100, difficulty: 2},
  {name: "Protéger le village", exp: 300, money: 150, difficulty: 3},
  {name: "Infiltration d'un camp ennemi", exp: 400, money: 200, difficulty: 4},
  {name: "Combat contre un ninja légendaire", exp: 500, money: 500, difficulty: 5}
];

// Commande start
bot.command('start', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  
  // Vérifier l'abonnement à la chaîne
  const isSubscribed = await checkSubscription(userId, ctx);
  
  if (!isSubscribed) {
    return ctx.reply(
      `⚠️ Pour utiliser ce bot, vous devez être abonné à notre chaîne.\n\nVeuillez vous abonner à ${CHANNEL_ID} puis réessayez avec /start`,
      Markup.inlineKeyboard([
        [Markup.button.url('📢 S\'abonner à la chaîne', `https://t.me/sineur_x_bot`)]
      ])
    );
  }

  // Ajouter le joueur
  if (!players[userId]) {
    players[userId] = {
      name: user.first_name,
      username: `@${user.username || 'Inconnu'}`,
      level: 1,
      exp: 0,
      money: 100,
      village: null,
      clan: null,
      health: 100,
      attack: 20,
      team: null,
      inventory: [],
      referrals: [],
      parrainage_done: false,
      last_bonus: null,
      mission_boost: 0,
      jutsu_used: null,
      banned: false
    };
  }

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📑 SUPPORT 📑', 'support_info'),
      Markup.button.callback('🤖 MISE À JOUR 🤖', 'update_info')
    ],
    [
      Markup.button.callback('🧑‍💻 DÉVELOPPEUR 🧑‍💻', 'developer_info'),
      Markup.button.callback('🕵 CRÉATEUR 🕵', 'creator_info')
    ],
    [
      Markup.button.callback('📜 MES COMMANDES 📜', 'user_commands')
    ]
  ]);

  // Message de bienvenue - envoyer un message texte directement puisque l'image est vide
  await ctx.reply(
    `Bienvenue ${user.first_name} dans l'univers de Naruto ! 🌸\nChoisis ton village pour commencer ton aventure.\nUtilise /village <nom du village> pour choisir un village.`,
    { 
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    }
  );
  saveData(players);
});

// Gérer les callbacks des boutons
bot.on('callback_query', async (ctx) => {
  const query = ctx.callbackQuery;
  let caption = '';

  switch (query.data) {
    case 'support_info':
      caption = "📑 **SUPPORT** 📑\n\nVoici le lien vers notre support : [Clique ici](https://t.me/GameFrenchSupport)";
      break;
    case 'update_info':
      caption = "🤖 **MISE À JOUR** 🤖\n\nConsultez les dernières mises à jour ici : [Clique ici](https://t.me/GameFrench)";
      break;
    case 'developer_info':
      caption = (
        "🧑‍💻 **DÉVELOPPEUR** 🧑‍💻\n\n" +
        "- Nom : 𝓢𝓲𝓷𝓮𝓾𝓻\n" +
        "- Contact : @ALTOF2\n" +
        "- ID : 5116530698\n\n" +
        "Merci d'utiliser ce bot ! 🚀"
      );
      break;
    case 'creator_info':
      caption = "🕵 **CRÉATEUR** 🕵\n\nDécouvrez le créateur ici : [𝓢𝓲𝓷𝓮𝓾𝓻](https://t.me/ALTOF2)";
      break;
    case 'user_commands':
      caption = (
        "📜 **MES COMMANDES** 📜\n\n" +
        "/start - Commencer l'aventure\n" +
        "/village - Choisir un village\n" +
        "/clan - Choisir un clan\n" +
        "/mission - Démarrer une mission\n" +
        "/inventory - Voir votre inventaire\n" +
        "/profile - Voir votre profil\n" +
        "/jutsu - Utiliser un jutsu\n" +
        "/shop - Accéder à la boutique\n" +
        "/buy - Acheter un objet\n" +
        "/utiliser - Utiliser un objet\n" +
        "/pvp - Combattre un autre joueur\n" +
        "/top_player - Voir les meilleurs joueurs\n" +
        "/equipe - Gérer votre équipe\n" +
        "/donner - Donner un objet\n" +
        "/bonus - Recevoir un bonus\n" +
        "/entrainement - S'entraîner pour améliorer vos compétences\n" +
        "/inviter - Inviter un ami\n" +
        "/mission_du_ninja_legendaire - Mission légendaire\n" +
        "/tournoi - Participer à un tournoi\n" +
        "/quitter_tournoi - Quitter un tournoi\n\n" +
        "🔹 Explorez ces commandes et amusez-vous bien ! 🎮"
      );
      break;
    case 'back_to_welcome':
      caption = (
        "Bienvenue à nouveau dans l'univers de Naruto ! 🌸\n" +
        "Choisis ton village pour commencer ton aventure.\n" +
        "Utilise /village <nom du village> pour choisir un village."
      );
      const welcomeKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📑 SUPPORT 📑', 'support_info'),
          Markup.button.callback('🤖 MISE À JOUR 🤖', 'update_info')
        ],
        [
          Markup.button.callback('🧑‍💻 DÉVELOPPEUR 🧑‍💻', 'developer_info'),
          Markup.button.callback('🕵 CRÉATEUR 🕵', 'creator_info')
        ],
        [
          Markup.button.callback('📜 MES COMMANDES 📜', 'user_commands')
        ]
      ]);
      await ctx.editMessageCaption(caption, {reply_markup: welcomeKeyboard});
      return;
    default:
      caption = "Option non reconnue. Veuillez réessayer.";
  }

  await ctx.editMessageCaption(caption, {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard([[Markup.button.callback('🔙 Retour', 'back_to_welcome')]])
  });
  saveData(players);
});

// Commande village
bot.command('village', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  
  // Vérifier l'abonnement à la chaîne
  const isSubscribed = await checkSubscription(userId, ctx);
  
  if (!isSubscribed) {
    return ctx.reply(
      `⚠️ Pour utiliser ce bot, vous devez être abonné à notre chaîne.\n\nVeuillez vous abonner à ${CHANNEL_ID} puis réessayez`,
      Markup.inlineKeyboard([
        [Markup.button.url('📢 S\'abonner à la chaîne', `https://t.me/sineur_x_bot`)]
      ])
    );
  }
  
  const village = ctx.message.text.split(' ').slice(1).join(' ');

  if (!villages.includes(village)) {
    return ctx.reply(`Village invalide. Choisis un village parmi : ${villages.join(', ')} 🚫`);
  }

  players[user.id].village = village;
  ctx.reply(`Tu as choisi le village ${village} 🌟.\nMaintenant, choisis ton clan ! Utilise /clan <nom du clan> pour choisir.`);
  saveData(players);
});

// Commande clan
bot.command('clan', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  
  // Vérifier l'abonnement à la chaîne
  const isSubscribed = await checkSubscription(userId, ctx);
  
  if (!isSubscribed) {
    return ctx.reply(
      `⚠️ Pour utiliser ce bot, vous devez être abonné à notre chaîne.\n\nVeuillez vous abonner à ${CHANNEL_ID} puis réessayez`,
      Markup.inlineKeyboard([
        [Markup.button.url('📢 S\'abonner à la chaîne', `https://t.me/sineur_x_bot`)]
      ])
    );
  }
  
  const clan = ctx.message.text.split(' ').slice(1).join(' ');

  if (!clans.includes(clan)) {
    return ctx.reply(`Clan invalide. Choisis un clan parmi : ${clans.join(', ')} 🚫`);
  }

  players[user.id].clan = clan;
  players[user.id].health = 100;
  ctx.reply(`Tu as choisi le clan ${clan} 🥷.\nTu es prêt à commencer ta première mission ! Utilise /mission pour commencer ta mission.`);
  saveData(players);
});


// Commande mission
bot.command('mission', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!players[userId]) {
    return ctx.reply("Tu n'es pas encore enregistré. Utilise la commande /start pour commencer.");
  }

  if (players[userId].health <= 0) {
    return ctx.reply("Tu es trop faible pour commencer une mission. Va récupérer de la santé. 🛌");
  }

  const mission = missions[Math.floor(Math.random() * missions.length)];
  const boost = players[userId].mission_boost || 0;
  const successChance = 50 + boost;
  const missionResult = Math.random() <= successChance / 100 ? "succès" : "échec";
  players[userId].mission_boost = 0;

  let message = '';
  if (missionResult === "succès") {
    players[userId].exp += mission.exp;
    players[userId].money += mission.money;
    message = `Mission réussie ! 🎉\nTu as gagné ${mission.exp} EXP et ${mission.money} ¥.`;
    if (Math.random() < 0.5) {
      const item = ["Shuriken", "Kunai", "Ramen", "Onigiri", "Bandage de soin", "Vêtement de ninja"][Math.floor(Math.random() * 6)];
      players[userId].inventory.push(item);
      message += `\nTu as trouvé un objet : ${item} 🛒.`;
    }
  } else {
    players[userId].health = Math.max(0, players[userId].health - mission.difficulty * 10);
    message = players[userId].health === 0 ? "Mission échouée et tu es tombé au combat ! 🛌 Tu as besoin de soins." : "Mission échouée ! Tente ta chance prochainement 😓.";
  }

  ctx.reply(message);
  levelUp(userId, ctx);
  saveData(players);
});

// Fonction pour gérer les niveaux
function levelUp(userId, ctx) {
  const player = players[userId];
  if (player.exp >= player.level * 500) {
    player.level++;
    player.exp = 0;
    player.health = 100 + (player.level * 20);
    ctx.reply(`Félicitations ! Tu as atteint le niveau ${player.level} ! 🎉 Tu as maintenant ${player.health} points de vie.`);
  }
}

// Commande profile
bot.command('profile', (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const player = players[userId];

  if (!player) {
    return ctx.reply("Tu n'es pas encore enregistré. Utilise /start pour commencer.");
  }

  const message = `Profil de ${player.name} (ID: ${userId}) :\n\n` +
    `🎮 Nom: ${player.name}\n` +
    `🎯 Niveau: ${player.level}\n` +
    `💎 EXP: ${player.exp}\n` +
    `💰 Argent: ${player.money} ¥\n` +
    `❤️ Santé: ${player.health}\n` +
    `🌍 Village: ${player.village || 'Aucun'}\n` +
    `🥷 Clan: ${player.clan || 'Aucun'}\n\n` +
    "Rappelle-toi, même les ninjas ont besoin de se reposer parfois ! 🛌";
  ctx.reply(message);
  saveData(players);
});

// Commande inventory
bot.command('inventory', (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const player = players[userId];

  if (!player) {
    return ctx.reply("Tu n'es pas encore enregistré. Utilise /start pour commencer.");
  }

  if (player.inventory.length === 0) {
    return ctx.reply("Ton inventaire est vide. Peut-être que tu devrais faire plus de missions ou en acheter des objets. 😅");
  }

  const items = player.inventory.join('\n');
  ctx.reply(`Ton inventaire :\n${items} 🎁`);
  saveData(players);
});


// Commande jutsu
bot.command('jutsu', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!players[userId] || !players[userId].clan) {
    return ctx.reply("Tu dois d'abord choisir ton clan avant d'utiliser un jutsu. 😅");
  }

  const jutsuList = jutsus[players[userId].clan];
  const jutsu = jutsuList[Math.floor(Math.random() * jutsuList.length)];
  players[userId].mission_boost = 20;
  players[userId].jutsu_used = jutsu;
  players[userId].health -= 10;

  let message = '';
  if (players[userId].health <= 0) {
    players[userId].health = 0;
    message = `Tu as utilisé le jutsu : ${jutsu} ! Mais tu es tombé au combat... Va récupérer de la santé. 🛌`;
  } else {
    message = `Tu as utilisé le jutsu : ${jutsu} ! Tes chances de réussir ta prochaine mission sont augmentées. 🔥`;
  }
  ctx.reply(message);
  saveData(players);
});


// Commande shop
bot.command('shop', (ctx) => {
  const message = "Bienvenue dans la boutique ! 🛍️\nVoici les objets disponibles à l'achat :\n" +
    "- Shuriken (50 ¥) 🌀\n" +
    "- Kunai (30 ¥) 🔪\n" +
    "- Vêtement de ninja (150 ¥) 👕\n" +
    "- Bandage de soin (200 ¥) 🩹\n" +
    "- Medicament de kiri (1500 ¥) 💊\n" +
    "- Senbei (100 ¥) 🍘\n" +
    "- Narutomaki (150 ¥) 🍥\n" +
    "- Riz cuit (100 ¥) 🍚\n" +
    "- Bento (200 ¥) 🍱\n" +
    "- Ramen (950 ¥) 🍜\n" +
    "- Curry japonais (300 ¥) 🍛\n" +
    "- Hamburger (500 ¥) 🍔\n" +
    "- Onigiri (120 ¥) 🍙";
  ctx.reply(message);
});


// Commande buy
bot.command('buy', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const args = ctx.message.text.split(' ').slice(1);
  const item = args.join(' ');
  const prices = {
    "Shuriken": 50, "Kunai": 30, "Vêtement de ninja": 150, "Bandage de soin": 200, "Medicament de kiri": 1500,
    "Senbei": 100, "Narutomaki": 150, "Riz cuit": 100, "Bento": 200,
    "Ramen": 250, "Curry japonais": 300, "Hamburger": 500, "Onigiri": 120
  };

  if (!prices[item]) {
    return ctx.reply("Objet invalide. Choisis un objet valide à acheter. 💸");
  }

  const price = prices[item];
  if (players[userId].money < price) {
    return ctx.reply(`Tu n'as pas assez d'argent pour acheter ${item}. 😭`);
  }

  players[userId].money -= price;
  players[userId].inventory.push(item);
  ctx.reply(`Tu as acheté ${item} pour ${price} ¥ ! 🎉`);
  saveData(players);
});


// Commande utiliser
bot.command('utiliser', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const item = ctx.message.text.split(' ').slice(1).join(' ');
  const objetsEffets = {
    "Shuriken": {pv: 0, exp: 500},
    "Kunai": {pv: 0, exp: 250},
    "Vêtement de ninja": {pv: 50, exp: 300},
    "Bandage de soin": {pv: 100, exp: 0},
    "Medicament de kiri": {pv: 1000, exp: 0},
    "Senbei": {pv: 10, exp: 50},
    "Narutomaki": {pv: 20, exp: 50},
    "Riz cuit": {pv: 30, exp: 60},
    "Bento": {pv: 40, exp: 70},
    "Ramen": {pv: 200, exp: 200},
    "Curry japonais": {pv: 80, exp: 80},
    "Hamburger": {pv: 40, exp: 25},
    "Onigiri": {pv: 60, exp: 10},
  };

  if (!players[userId].inventory.includes(item)) {
    return ctx.reply(`Tu ne possèdes pas ${item} dans ton inventaire.`);
  }

  if (!objetsEffets[item]) {
    return ctx.reply(`L'objet '${item}' n'existe pas ou ne peut pas être utilisé.`);
  }

  const effet = objetsEffets[item];
  players[userId].health += effet.pv;
  players[userId].exp += effet.exp;
  players[userId].inventory.splice(players[userId].inventory.indexOf(item), 1);

  let message = `Vous avez utilisé ${item} !\n`;
  if (effet.pv > 0) {
    message += `❤️ Points de vie récupérés : ${effet.pv}\n`;
  }
  if (effet.exp > 0) {
    message += `🌟 Points d'expérience gagnés : ${effet.exp}`;
  }
  ctx.reply(message);
  saveData(players);
});

// Commande pvp
bot.command('pvp', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const args = ctx.message.text.split(' ').slice(1);

  if (userId in pending_requests) {
    if (args.length === 0) {
      return ctx.reply("Tu as une demande de combat en attente ! Réponds avec /pvp accepte ou /pvp refuse.");
    }
    const challengerId = pending_requests[userId];
    const response = args[0].toLowerCase();

    if (response === "accepte") {
      ctx.reply("Tu as accepté le combat ! Que le duel commence.");
      await ctx.telegram.sendMessage(challengerId, `${players[userId].name} a accepté le combat ! Le duel commence.`);
      simulatePvp(challengerId, userId, ctx);
    } else if (response === "refuse") {
      ctx.reply("Tu as refusé le combat.");
      await ctx.telegram.sendMessage(challengerId, `${players[userId].name} a refusé le combat.`);
    } else {
      ctx.reply("Réponse invalide. Utilise /pvp accepte ou /pvp refuse.");
    }
    delete pending_requests[userId];
    return;
  }

  if (args.length === 0) {
    return ctx.reply("Utilise la commande comme ceci : /pvp <ID de l'utilisateur cible>.");
  }

  let enemyId;
  try {
    enemyId = parseInt(args[0]);
  } catch (error) {
    return ctx.reply("L'ID doit être un nombre valide.");
  }

  if (!players[enemyId]) {
    return ctx.reply("Le joueur spécifié n'existe pas.");
  }

  if (userId === enemyId) {
    return ctx.reply("Tu ne peux pas te battre contre toi-même !");
  }

  if (enemyId in pending_requests) {
    return ctx.reply("Ce joueur a déjà une demande de combat en attente.");
  }

  pending_requests[enemyId] = userId;
  await ctx.telegram.sendMessage(enemyId, `${players[userId].name} te défie en duel !\nRéponds avec /pvp accepte ou /pvp refuse.`);
  ctx.reply("Demande de combat envoyée !");
  saveData(players);
});


async function simulatePvp(challengerId, defenderId, ctx) {
  const challenger = players[challengerId];
  const defender = players[defenderId];

  const challengerDamage = Math.floor(Math.random() * (challenger.attack - 10 + 1)) + 10;
  const defenderDamage = Math.floor(Math.random() * (defender.attack - 10 + 1)) + 10;

  challenger.health -= defenderDamage;
  defender.health -= challengerDamage;

  let result = '';
  if (challenger.health <= 0 && defender.health <= 0) {
    result = "Le combat est nul ! Les deux joueurs sont à terre. 💀";
    challenger.health = 0;
    defender.health = 0;
  } else if (challenger.health <= 0) {
    result = `${defender.name} a gagné le combat contre ${challenger.name} ! 🎉`;
    defender.exp += 100;
    defender.money += 50;
    challenger.health = 0;
  } else if (defender.health <= 0) {
    result = `${challenger.name} a gagné le combat contre ${defender.name} ! 🎉`;
    challenger.exp += 100;
    challenger.money += 50;
    defender.health = 0;
  } else {
    result = (
      `⚔️ Résultat du combat :\n` +
      `${challenger.name} a infligé ${challengerDamage} dégâts.\n` +
      `${defender.name} a infligé ${defenderDamage} dégâts.\n\n` +
      `Statistiques restantes :\n` +
      `${challenger.name} - Santé : ${challenger.health} ❤️\n` +
      `${defender.name} - Santé : ${defender.health} ❤️`
    );
  }

  await ctx.telegram.sendMessage(challengerId, result);
  await ctx.telegram.sendMessage(defenderId, result);
  saveData(players);
}

// Commande top_player
bot.command('top_player', (ctx) => {
  const vraisJoueurs = Object.entries(players).filter(([userId, data]) => !data.is_example).map(([userId, data]) => ({userId, ...data}));

  if (vraisJoueurs.length === 0) {
    return ctx.reply("Aucun joueur enregistré pour le moment. 🫤");
  }

  vraisJoueurs.sort((a, b) => (b.level - a.level) || (b.exp - a.exp));

  let message = "🏆 Classement des meilleurs joueurs 🏆\n";
  vraisJoueurs.forEach((player, index) => {
    message += `${index + 1}. ${player.username} (${player.name})\n` +
      `   Niveau : ${player.level}, EXP : ${player.exp}, ¥ : ${player.money}\n`;
  });
  ctx.reply(message);
  saveData(players);
});


// Commande equipe
bot.command('equipe', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const args = ctx.message.text.split(' ').slice(1);

  if (args.length === 0) {
    let foundTeam = false;
    for (const senseiId in teams) {
      const team = teams[senseiId];
      if (userId == senseiId || team.members.includes(userId)) {
        let members = [`👨‍🏫 Sensei: ${team.sensei} (ID: ${team.sensei_id})`];
        members = members.concat(team.members.map(memberId => `- 🥷 ${players[memberId].username || 'Inconnu'} (ID: ${memberId})`));
        ctx.reply(
          `🔱 Informations de l'équipe :\n` +
          `🏷️ Nom de l'équipe : ${team.name}\n` +
          `👥 Membres :\n${members.join('\n')}`
        );
        foundTeam = true;
        break;
      }
    }
    if (!foundTeam) {
      ctx.reply("❌ Tu ne fais partie d'aucune équipe. Utilise /equipe create <nom de l'équipe> pour en savoir plus. ⚔️");
    }
    return;
  }

  const command = args[0];

  if (command === 'create') {
    if (players[userId].level < 1000) {
      return ctx.reply("⚠️ Tu dois être au niveau 1000 pour créer une équipe.");
    }
    if (teams[userId]) {
      return ctx.reply("⚠️ Tu as déjà créé une équipe.");
    }
    const teamName = args.slice(1).join(' ') || `Équipe de ${user.first_name}`;
    teams[userId] = {
      sensei: user.username || 'Inconnu',
      sensei_id: userId,
      name: teamName,
      members: []
    };
    ctx.reply(`✅ Équipe '${teamName}' créée avec succès ! 🎉`);
  } else if (parseInt(command)) {
    const targetId = parseInt(command);
    if (!teams[userId]) {
      return ctx.reply("⚠️ Tu n'as pas encore créé d'équipe.");
    }
    const team = teams[userId];
    if (team.members.length >= 4) {
      return ctx.reply("⚠️ Ton équipe est déjà complète (4 membres max).");
    }
    if (team.members.includes(targetId)) {
      return ctx.reply("⚠️ Ce joueur est déjà dans ton équipe.");
    }
    if (targetId === userId) {
      return ctx.reply("⚠️ Tu ne peux pas t'ajouter toi-même à ton équipe.");
    }
    if (!players[targetId]) {
      return ctx.reply("⚠️ Ce joueur n'est pas enregistré dans le jeu.");
    }
    team.members.push(targetId);
    ctx.reply(`✅ Le joueur ${players[targetId].username || 'Inconnu'} a été ajouté à l'équipe.`);
    try {
      await ctx.telegram.sendMessage(targetId, `👋 Tu as été ajouté à l'équipe '${team.name}' par ${user.username || 'Inconnu'}.\n` +
        `Utilise /equipe pour consulter les informations de l'équipe. 🔱`);
    } catch (error) {
      ctx.reply("⚠️ Impossible de notifier ce joueur. Peut-être qu'il n'a pas démarré le bot.");
    }
  } else if (command === 'quit') {
    for (const senseiId in teams) {
      const team = teams[senseiId];
      if (team.members.includes(userId)) {
        team.members.splice(team.members.indexOf(userId), 1);
        ctx.reply("🚶 Tu as quitté l'équipe.");
        return;
      }
    }
    ctx.reply("⚠️ Tu ne peux pas quitter une équipe à laquelle tu n'appartiens pas.");
  } else {
    ctx.reply(
      "❌ Commande invalide. Voici ce que tu peux faire :\n" +
      "- /equipe create <nom> : Créer une équipe.\n" +
      "- /equipe <ID utilisateur> : Ajouter un joueur à ton équipe.\n" +
      "- /equipe quit : Quitter l'équipe."
    );
  }
  saveData(players);
  saveData(teams);
});

// Commande donner
bot.command('donner', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const args = ctx.message.text.split(' ').slice(1);

  if (args.length < 3) {
    return ctx.reply("Usage : /donner <argent|objet> <montant/objet> <ID joueur>");
  }

  const typeDon = args[0].toLowerCase();
  let targetId;
  try {
    targetId = parseInt(args[2]);
  } catch (error) {
    return ctx.reply("L'ID du joueur doit être un nombre valide.");
  }

  if (!players[targetId]) {
    return ctx.reply("Le joueur spécifié n'existe pas. 🚫");
  }

  if (userId === targetId) {
    return ctx.reply("Tu ne peux pas te donner quelque chose à toi-même. 🚫");
  }

  if (typeDon === 'argent') {
    let montant;
    try {
      montant = parseInt(args[1]);
    } catch (error) {
      return ctx.reply("Le montant doit être un nombre valide.");
    }
    if (players[userId].money < montant) {
      return ctx.reply("Tu n'as pas assez d'argent pour effectuer ce don. 💸");
    }
    players[userId].money -= montant;
    players[targetId].money += montant;
    ctx.reply(`✅ Tu as donné ${montant} ¥ à ${players[targetId].username} ! 💰`);
    await ctx.telegram.sendMessage(targetId, `${players[userId].username} t'a donné ${montant} ¥ ! 💰`);
  } else if (typeDon === 'objet') {
    const objet = args[1];
    if (!players[userId].inventory.includes(objet)) {
      return ctx.reply("Tu ne possèdes pas cet objet. 🎒");
    }
    players[userId].inventory.splice(players[userId].inventory.indexOf(objet), 1);
    players[targetId].inventory.push(objet);
    ctx.reply(`✅ Tu as donné ${objet} à ${players[targetId].username} ! 🎁`);
    await ctx.telegram.sendMessage(targetId, `${players[userId].username} t'a donné un objet : ${objet} ! 🎁`);
  } else {
    ctx.reply("Type de don invalide. Utilise 'argent' ou 'objet'.");
  }
  saveData(players);
});

// Commande bonus
bot.command('bonus', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!players[userId]) {
    return ctx.reply("Tu n'es pas encore enregistré ! Utilise la commande /start pour commencer ton aventure. 🌟");
  }

  const lastBonus = players[userId].last_bonus;
  const currentTime = new Date();

  if (lastBonus) {
    const timeDiff = currentTime - new Date(lastBonus);
    if (timeDiff < 86400000) { // 24 hours in milliseconds
      const remainingTime = 86400000 - timeDiff;
      const hours = Math.floor(remainingTime / 3600000);
      const minutes = Math.floor((remainingTime % 3600000) / 6000);
      return ctx.reply(`Tu as déjà récupéré ton bonus aujourd'hui ! ⏳ Reviens dans ${hours}h ${minutes}min pour un nouveau bonus. 💎`);
    }
  }

  const bonusMoney = 500;
  const bonusExp = 100;
  players[userId].money += bonusMoney;
  players[userId].exp += bonusExp;
  players[userId].last_bonus = currentTime.toISOString();

  ctx.reply(
    `🎁 Bonus quotidien récupéré !\n` +
    `💰 Argent : +${bonusMoney}¥\n` +
    `🌟 EXP : +${bonusExp}\n` +
    `Reviens demain pour un nouveau bonus ! 🎉`
  );
  saveData(players);
});

// Commande entrainement
bot.command('entrainement', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (players[userId].money < 10) {
    return ctx.reply("Tu n'as pas assez d'argent pour t'entraîner. Il te faut 10 ¥. 🏋️");
  }

  players[userId].money -= 10;
  players[userId].exp += 20;
  ctx.reply("🏋️ Tu t'es entraîné avec 10¥ et tu as gagné 20 EXP ! Continue à progresser.");
  saveData(players);
});


// Commande inviter
bot.command('inviter', (ctx) => {
  const user = ctx.from;
  const userId = user.id;
  const invitationLink = `https://t.me/MondeDeNinjasBot?start=${userId}`;
  const message = `🎉 Invite tes amis et gagne 500 ¥ et 500 EXP par personne invitée !\nVoici ton lien d'invitation :\n${invitationLink}`;
  ctx.reply(message);
});

// Commande mission_du_ninja_legendaire
bot.command('mission_du_ninja_legendaire', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (players[userId].level < 1000) {
    return ctx.reply("Tu dois être au moins niveau 1000 pour effectuer une mission ninja légendaire. 💪");
  }

  if (players[userId].health <= 0) {
    return ctx.reply("Tu es trop faible pour accomplir cette mission. Va récupérer de la santé. 🛌");
  }

  const missionResult = Math.random() < 0.7 ? "succès" : "échec";

  if (missionResult === "succès") {
    const expGagne = 5000;
    const argentGagne = 10000;
    players[userId].exp += expGagne;
    players[userId].money += argentGagne;
    let niveauxGagnes = Math.floor(players[userId].exp / 500);
    players[userId].level += niveauxGagnes;
    players[userId].exp %= 500;
    const santeTotaleGagnee = 20 * niveauxGagnes;
    players[userId].health += santeTotaleGagnee;
    let message = `Bravo ! 🌟 Tu as réussi une mission ninja légendaire.\n🎁 Récompenses totales : ${expGagne} EXP et ${argentGagne} ¥.\n`;
    if (niveauxGagnes > 0) {
      message += `🎉 Félicitations ! Tu as gagné ${niveauxGagnes} niveau(x) supplémentaire(s), atteignant le niveau ${players[userId].level}.\n❤️ Ta santé a augmenté de ${santeTotaleGagnee} points.`;
    }
    ctx.reply(message);
  } else {
    ctx.reply("La mission a échoué... 😓 Tu devras encore t'entraîner avant d'affronter de tels défis.");
  }
  saveData(players);
});



// Commande tournoi
bot.command('tournoi', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (tournoiParticipants.includes(userId)) {
    return ctx.reply("Vous êtes déjà inscrit au tournoi ! ⏳");
  }

  tournoiParticipants.push(userId);
  ctx.reply("Vous êtes inscrit au tournoi ! 🏆");

  if (tournoiParticipants.length === 4) {
    ctx.reply("Le tournoi commence maintenant ! 🎉");

    const combats = [];
    for (let i = 0; i < 3; i++) {
      const [combattant1, combattant2] = shuffleArray(tournoiParticipants).slice(0, 2);
      const vainqueur = Math.random() < 0.5 ? combattant1 : combattant2;
      const perdant = vainqueur === combattant1 ? combattant2 : combattant1;
      combats.push({vainqueur, perdant});
      tournoiParticipants.splice(tournoiParticipants.indexOf(perdant), 1);

      for (const participant of [...tournoiParticipants, perdant]) {
        await ctx.telegram.sendMessage(
          participant,
          `Combat ${i + 1} terminé :\n${players[combattant1].username || 'Inconnu'} 🆚 ${players[combattant2].username || 'Inconnu'}\n` +
          `🏆 Vainqueur : ${players[vainqueur].username || 'Inconnu'}\n❌ Perdant : ${players[perdant].username || 'Inconnu'}`
        );
      }
    }

    const gagnant = tournoiParticipants[0];
    tournoiParticipants = [];
    players[gagnant].exp += 1000;
    players[gagnant].money += 5000;
    while (players[gagnant].exp >= 500) {
      players[gagnant].level++;
      players[gagnant].exp -= 500;
      players[gagnant].health += 20;
    }

    for (const participant of Object.keys(players)) {
      await ctx.telegram.sendMessage(
        participant,
        `Le tournoi est terminé ! 🎉\n🏆 Vainqueur : ${players[gagnant].username || 'Inconnu'}\n+1000 EXP et +5000 ¥ pour le gagnant !`
      );
    }
  } else {
    ctx.reply(`Le tournoi démarre lorsque 4 joueurs sont inscrits. (${tournoiParticipants.length}/4)`);
  }
  saveData(players);
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Commande quitter_tournoi
bot.command('quitter_tournoi', (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!tournoiParticipants.includes(userId)) {
    return ctx.reply("Vous n'êtes pas inscrit au tournoi ! ❌");
  }

  tournoiParticipants.splice(tournoiParticipants.indexOf(userId), 1);
  ctx.reply("Vous avez quitté le tournoi. 😔");

  for (const participant of tournoiParticipants) {
    ctx.telegram.sendMessage(participant, `${user.first_name} (@${user.username}) a quitté le tournoi. 😔`);
  }
  saveData(players);
});

// Fonction pour vérifier si l'utilisateur est le créateur
function isCreator(userId) {
  return userId === CREATOR_ID;
}

// Commande ban
bot.command('ban', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  if (ctx.message.text.split(' ').length === 1) {
    return ctx.reply("Utilisation : /ban <ID utilisateur>");
  }

  const targetId = parseInt(ctx.message.text.split(' ')[1]);
  if (!players[targetId]) {
    return ctx.reply("Cet utilisateur n'existe pas ou n'est pas enregistré.");
  }

  players[targetId].banned = true;
  ctx.reply(`L'utilisateur avec l'ID ${targetId} a été banni.`);
  saveData(players);
});


// Commande unban
bot.command('unban', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  if (ctx.message.text.split(' ').length === 1) {
    return ctx.reply("Utilisation : /unban <ID utilisateur>");
  }

  const targetId = parseInt(ctx.message.text.split(' ')[1]);
  if (!players[targetId]) {
    return ctx.reply("Cet utilisateur n'existe pas ou n'est pas enregistré.");
  }

  players[targetId].banned = false;
  ctx.reply(`L'utilisateur avec l'ID ${targetId} a été débanni.`);
  saveData(players);
});


// Commande broadcast
bot.command('broadcast', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  if (ctx.message.text.split(' ').length === 1) {
    return ctx.reply("Utilisation : /broadcast <message>");
  }

  const message = ctx.message.text.split(' ').slice(1).join(' ');
  for (const playerId in players) {
    try {
      await ctx.telegram.sendMessage(playerId, `Message du créateur :\n${message}`);
    } catch (error) {
      console.error(`Impossible d'envoyer un message à ${playerId}: ${error}`);
    }
  }
  ctx.reply("Message diffusé à tous les utilisateurs.");
  saveData(players);
});

// Commande stats
bot.command('stats', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  if (Object.keys(players).length === 0) {
    return ctx.reply("Aucun utilisateur enregistré pour l'instant.");
  }

  let statsMessage = "📊 **Statistiques des utilisateurs :**\n\n";
  let totalUsers = 0;

  for (const uid in players) {
    const player = players[uid];
    const username = player.username;
    const name = player.name;
    const level = player.level;
    const exp = player.exp;
    const money = player.money;
    const health = player.health;
    const village = player.village || "Non défini";
    const clan = player.clan || "Non défini";

    statsMessage += (
      `👤 **Nom d'utilisateur :** ${username}\n` +
      `🆔 **ID :** ${uid}\n` +
      `🏅 **Niveau :** ${level}\n` +
      `🌟 **EXP :** ${exp}\n` +
      `💰 **Argent :** ${money} ¥\n` +
      `❤️ **Santé :** ${health}\n` +
      `🏘️ **Village :** ${village}\n` +
      `👪 **Clan :** ${clan}\n` +
      "--------------------------------------\n"
    );
    totalUsers++;
  }

  statsMessage += `\n📈 **Nombre total d'utilisateurs :** ${totalUsers}`;
  ctx.reply(statsMessage);
  saveData(players);
});


// Commande annonce
bot.command('annonce', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  if (ctx.message.text.split(' ').length === 1) {
    return ctx.reply("Utilisation : /annonce <message>");
  }

  const message = ctx.message.text.split(' ').slice(1).join(' ');
  for (const playerId in players) {
    try {
      await ctx.telegram.sendMessage(playerId, `📢 Annonce :\n${message}`);
    } catch (error) {
      console.error(`Impossible d'envoyer une annonce à ${playerId}: ${error}`);
    }
  }
  ctx.reply("Annonce envoyée à tous les utilisateurs.");
  saveData(players);
});


// Commande dieu
bot.command('dieu', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!isCreator(userId)) {
    return ctx.reply("Tu n'as pas l'autorisation d'utiliser cette commande.");
  }

  players[userId] = {
    name: user.first_name || "Créateur",
    username: `@${user.username || `ID_${userId}`}`,
    level: 100000000,
    exp: 100000000,
    money: 100000000,
    village: "Divin",
    clan: "Divin",
    health: 100000000,
    team: null,
    inventory: Array(100000000).fill("∞"),
    is_god_mode: true,
    last_bonus: null,
    mission_boost: 0,
    jutsu_used: null,
    banned: false
  };

  ctx.reply("Mode dieu activé ! 😇 Toutes les activités sont maintenant gagnées automatiquement.");
  saveData(players);
});


// Commande none
bot.command('none', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (userId !== CREATOR_ID) {
    return ctx.reply("Tu n'as pas la permission d'utiliser cette commande.");
  }

  if (!players[userId]) {
    return ctx.reply("Tu n'es pas encore enregistré. Utilise /start pour commencer.");
  }

  if (players[userId].is_god_mode) {
    players[userId].is_god_mode = false;
    players[userId].health = 100;
    players[userId].attack = 20;
    players[userId].level = 1;
    players[userId].exp = 0;
    players[userId].money = 100;
    players[userId].inventory = [];
    ctx.reply("Le mode dieu a été désactivé et tes statistiques ont été réinitialisées.");
  } else {
    ctx.reply("Le mode dieu est déjà désactivé.");
  }
  saveData(players);
});


// Commande restart
bot.command('restart', async (ctx) => {
  const user = ctx.from;
  const userId = user.id;

  if (!players[userId]) {
    return ctx.reply("Tu n'es pas encore enregistré. Utilise /start pour commencer.");
  }

  players[userId] = {
    name: user.first_name,
    username: `@${user.username || 'Inconnu'}`,
    level: 1,
    exp: 0,
    money: 100,
    village: null,
    clan: null,
    health: 100,
    attack: 20,
    team: null,
    inventory: [],
    referrals: [],
    parrainage_done: false,
    last_bonus: null,
    mission_boost: 0,
    jutsu_used: null,
    banned: false
  };

  ctx.reply(`Tes données ont été réinitialisées avec succès, ${user.first_name}! Recommence ton aventure ! 🌸`);
  saveData(players);
});


// Middleware pour vérifier l'abonnement pour toutes les commandes
bot.use(async (ctx, next) => {
  // Skip la vérification pour /start car elle a sa propre vérification
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/start')) {
    await next();
    return;
  }
  
  // Vérifier l'abonnement uniquement pour les commandes
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    const userId = ctx.from.id;
    const isSubscribed = await checkSubscription(userId, ctx);
    
    if (!isSubscribed) {
      return ctx.reply(
        `⚠️ Pour utiliser ce bot, vous devez être abonné à notre chaîne.\n\nVeuillez vous abonner à ${CHANNEL_ID} puis réessayez`,
        Markup.inlineKeyboard([
          [Markup.button.url('📢 S\'abonner à la chaîne', `https://t.me/sineur_x_bot`)]
        ])
      );
    }
  }
  
  await next();
  saveData(players);
  saveData(teams);
});


// Charger les données au démarrage
players = loadData();

// Démarrer le bot
bot.launch().then(() => {
  console.log('Bot démarré !');
}).catch(err => {
  console.error('Erreur au démarrage du bot:', err);
});

// Gérer l'arrêt propre
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));