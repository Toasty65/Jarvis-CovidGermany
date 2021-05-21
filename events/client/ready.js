module.exports = client => {
	client.user.setActivity(`Prefix = '${process.env.PREFIX}'`, { type: 'WATCHING'});
	console.log('Bot ist online!');
};