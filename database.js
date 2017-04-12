var mysql = require('mysql');


// database connection
var connection = mysql.createConnection({
    host: '127.0.0.1',
    port: '8889',
    user: 'root',
    password: 'root',
    database: 'paladin'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log('Connected to database');
});

module.exports = connection;



