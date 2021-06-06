require('dotenv').config();
const mongo = require('../../util/mongo');
const prefixSchema = require('../../schemas/prefix-schema');
const cache = {};

const validatePermissions = (permissions) => {
	const validPermissions = [
		'CREATE_INSTANT_INVITE',
		'KICK_MEMBERS',
		'BAN_MEMBERS',
		'ADMINISTRATOR',
		'MANAGE_CHANNELS',
		'MANAGE_GUILD',
		'ADD_REACTIONS',
		'VIEW_AUDIT_LOG',
		'PRIORITY_SPEAKER',
		'STREAM',
		'VIEW_CHANNEL',
		'SEND_MESSAGES',
		'SEND_TTS_MESSAGES',
		'MANAGE_MESSAGES',
		'EMBED_LINKS',
		'ATTACH_FILES',
		'READ_MESSAGE_HISTORY',
		'MENTION_EVERYONE',
		'USE_EXTERNAL_EMOJIS',
		'VIEW_GUILD_INSIGHTS',
		'CONNECT',
		'SPEAK',
		'MUTE_MEMBERS',
		'DEAFEN_MEMBERS',
		'MOVE_MEMBERS',
		'USE_VAD',
		'CHANGE_NICKNAME',
		'MANAGE_NICKNAMES',
		'MANAGE_ROLES',
		'MANAGE_WEBHOOKS',
		'MANAGE_EMOJIS',
	];

	for (const permission of permissions) {
		if (!validPermissions.includes(permission)) {
			throw new Error(`Unknown permission node "${permission}"`);
		}
	}
};

module.exports = async (Discord, client, message) => {
	const { member, content, guild } = message;

	let data = cache[guild.id];

	if(!data) {
		console.log('Fetching prefix from database!');

		await mongo().then(async mongoose => {
			try {
				const result = await prefixSchema.findById(guild.id);

				if(result) {
					cache[guild.id] = data = [result.prefix];
				}
				else {
					cache[guild.id] = data = ['.'];
				}

			} finally {
				mongoose.connection.close();
			}
		});
	}

	const serverPrefix = data[0];

	if(!content.startsWith(serverPrefix) || message.author.bot) return;


	const args = content.slice(serverPrefix.length).split(/ +/);
	const cmd = args.shift().toLowerCase();
	const command = message.client.commands.get(cmd);

	if(!command) return;

	let {
		permissions = [],
		permissionError = 'Dir fehlt die Berechtigung, diesen Befehl auszuführen!',
		requiredRoles = [],
		minArgs = 0,
		maxArgs = null,
		expectedArgs = '',
		execute,
		guildOnly,
	} = command;

	if(guildOnly && message.channel.type === 'dm') return message.reply('Dieser Befehl funktioniert nur auf einem Server!');

	// Ensure the permissions are in an array and are all valid
	if (permissions.length) {
		if (typeof permissions === 'string') {
			permissions = [permissions];
		}

		validatePermissions(permissions);
	}

	// Ensure the user has the required permissions
	for (const permission of permissions) {
		if (!member.hasPermission(permission)) {
			message.reply(permissionError);
			return;
		}
	}

	let roleCount = 0;
	let missingRole = '';

	// Ensure the user has the required roles
	for (const requiredRole of requiredRoles) {
		const role = guild.roles.cache.find(
			r => r.name === requiredRole,
		);

		if (role && member.roles.cache.has(role.id)) {
			roleCount++;
		}
		else {
			missingRole = requiredRole;
		}
	}
	
	if(roleCount === 0 && requiredRoles.length > 0) {
		return message.reply(
			`Du benötigst die "${missingRole}" Rolle um diesen Befehl zu benutzen!`,
		);
	}

	// Ensure we have the correct number of arguments
	if (
		args.length < minArgs || (maxArgs !== null && args.length > maxArgs)
	) {
		return message.reply(
			`Falscher Syntax! Versuche ${serverPrefix}${command.name} ${expectedArgs}`,
		);
	}

	message.delete()
		.then(() => {
			message.channel.startTyping();
			execute(message, args, Discord, client);
		})
		.then(() => message.channel.stopTyping(true));
};

module.exports.cache = cache;