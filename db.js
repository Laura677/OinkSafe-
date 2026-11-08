const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '402755', 
    database: 'oinksafe_db' 
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Conectado à base de dados MySQL!');
});

module.exports = connection;
