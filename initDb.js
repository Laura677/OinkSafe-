const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function initDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'admin',
            multipleStatements: true
        });

        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const insertsPath = path.join(__dirname, 'database', 'inserts.sql');
        const viewsPath = path.join(__dirname, 'database', 'views.sql');
        const functionsPath = path.join(__dirname, 'database', 'functions.sql');
    const proceduresPath = path.join(__dirname, 'database', 'procedures.sql');        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const inserts = fs.readFileSync(insertsPath, 'utf8');
        const views = fs.readFileSync(viewsPath, 'utf8');
        const functions = fs.readFileSync(functionsPath, 'utf8');
        const procedures = fs.readFileSync(proceduresPath, 'utf8');    
        await connection.query(schema);

        const [usuarios] = await connection.query(
            'SELECT COUNT(*) AS total FROM oinksafe_db.usuarios'
        );

        if (usuarios[0].total === 0) {
            await connection.query(inserts);
            console.log('Dados iniciais inseridos com sucesso.');
        } else {
            console.log('Dados iniciais já existem. Inserts ignorados.');
        }

        await connection.query(views);
        console.log('Views criadas com sucesso.');
        await connection.query(functions);
        console.log('Functions criadas com sucesso.');    
        await connection.query(procedures);
        console.log('Procedures criadas com sucesso.');
        console.log('Banco de dados inicializado com sucesso.');

    } catch (error) {
        console.error('Erro ao inicializar o banco:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();