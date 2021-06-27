const mongo = require('../util/mongo');
const prefixSchema = require('../schemas/prefix-schema');

module.exports = {
	name: 'help',
	minArgs: 0,
	maxArgs: 0,
	guildOnly: true,
	execute: async (message) => {
		const { client, guild } = message;
		let prefix;

		await mongo().then(async mongoose => {
			try {
				const result = await prefixSchema.findById(guild.id);
				result ? prefix = result.prefix : prefix = '<No prefix defined yet!> ';
			}
			finally {
				mongoose.connection.close();
			}
		});

		const fields = client.commands.map(cmd => ({
			name: '`' + cmd.name + '`',
			value: `**Arguments**:
			${cmd.expectedArgs ? cmd.expectedArgs : ''}

			**Min. Args**: 
			${cmd.minArgs}

			**Max. Args**: 
			${cmd.maxArgs}

			**Needed Permission(s)**: 
			${cmd.permissions ? cmd.permissions : 'No permisions needed'}

			**Guild only?** 
			${cmd.guildOnly}`,
			inline: true,
		}),
		);

		const helpEmbed = {
			color: 0x1E92F4,
			title: 'Available commands:',
			url: 'https://top.gg/bot/835889285055905803',
			description: '**Prefix**:\n`' + prefix + '`',
			author: {
				name: client.user.username,
				icon_url: client.user.displayAvatarURL(),
			},
			fields,
		};

		message.channel.send({ embed: helpEmbed });
	},
};