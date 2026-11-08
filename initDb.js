
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function initDatabase() {
    let connection;

    try {
        const dbName = (process.env.DB_NAME || 'oinksafe_db').trim();

        if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
            throw new Error('Nome do banco de dados inválido.');
        }

        connection = await mysql.createConnection({
            host: (process.env.DB_HOST || 'localhost').trim(),
            port: Number(process.env.DB_PORT || 3306),
            user: (process.env.DB_USER || 'root').trim(),
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('Conectado ao MySQL.');

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
        );

        await connection.query(`USE \`${dbName}\``);

        console.log('Banco selecionado:', dbName);

        const pasta = path.join(__dirname, 'database');

        function lerSQL(arquivo) {
            return fs.readFileSync(
                path.join(pasta, arquivo),
                'utf8'
            );
        }

        // Substitui referências ao banco local
        // pelo banco configurado no ambiente.
        function prepararSQL(sql) {
            return sql
                .replace(
                    /`?oinksafe_db`?/gi,
                    `\`${dbName}\``
                )
                .replace(
                    /CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?railway`?\s*;/gi,
                    ''
                );
        }

        async function executarSQL(arquivo) {
            const sql = prepararSQL(lerSQL(arquivo));

            if (sql.trim()) {
                await connection.query(sql);
            }
        }

        // Cria as tabelas
        await executarSQL('schema.sql');
        console.log('Schema executado com sucesso.');

        // Verifica dados iniciais
        const [usuarios] = await connection.query(
            'SELECT COUNT(*) AS total FROM usuarios'
        );

        if (usuarios[0].total === 0) {
            await executarSQL('inserts.sql');
            console.log('Dados iniciais inseridos com sucesso.');
        } else {
            console.log('Dados iniciais já existem.');
        }

        await executarSQL('views.sql');
        console.log('Views criadas com sucesso.');

        await executarSQL('functions.sql');
        console.log('Functions criadas com sucesso.');

        await executarSQL('procedures.sql');
        console.log('Procedures criadas com sucesso.');

        console.log('Banco de dados inicializado com sucesso.');

    } catch (error) {
        console.error(
            'Erro ao inicializar o banco:',
            error.message
        );

        process.exitCode = 1;

    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
