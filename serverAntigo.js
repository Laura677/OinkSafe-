// server.js


// =========================================================
// IMPORTAÇÕES
// =========================================================

const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const db = require('./db')


// =========================================================
// CONFIGURAÇÃO DO EXPRESS
// =========================================================

const app = express()

app.use(cors())
app.use(express.json())


// =========================================================
// ROTA PRINCIPAL
// =========================================================

app.get('/', (req, res) => {

    res.json({
        status: 'ok',
        mensagem: 'API OinkSafe funcionando'
    })

})


// =========================================================
// USUÁRIOS
// =========================================================


// =========================================================
// CADASTRAR USUÁRIO
// =========================================================

app.post('/api/registrar', async (req, res) => {

    const {
        nome,
        email,
        senha
    } = req.body


    if (
        !nome ||
        !email ||
        !senha
    ) {

        return res.status(400).json({
            message: 'Preencha todos os campos.'
        })
    }


    try {

        // Verifica se já existe usuário
        // com o mesmo e-mail.
        db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email],
            async (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                if (
                    results.length > 0
                ) {

                    return res.status(400).json({
                        message:
                            'Este email já está cadastrado!'
                    })
                }


                // Criptografa a senha.
                const hashSenha =
                    await bcrypt.hash(
                        senha,
                        10
                    )


                const sql = `
                    INSERT INTO usuarios
                    (nome, email, senha)
                    VALUES (?, ?, ?)
                `


                db.query(
                    sql,
                    [
                        nome,
                        email,
                        hashSenha
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                error: err.message
                            })
                        }


                        res.status(201).json({
                            message:
                                'Cadastro realizado com sucesso!'
                        })
                    }
                )
            }
        )

    } catch (error) {

        res.status(500).json({
            error: 'Erro no servidor'
        })
    }
})


// =========================================================
// LOGIN
// =========================================================

app.post('/api/login', (req, res) => {

    const {
        email,
        senha
    } = req.body


    if (
        !email ||
        !senha
    ) {

        return res.status(400).json({
            message:
                'Preencha email e senha.'
        })
    }


    db.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email],

        async (err, results) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                })
            }


            if (
                results.length === 0
            ) {

                return res.status(400).json({
                    message:
                        'Email ou senha incorretos!'
                })
            }


            const usuario =
                results[0]


            const senhaValida =
                await bcrypt.compare(
                    senha,
                    usuario.senha
                )


            if (!senhaValida) {

                return res.status(400).json({
                    message:
                        'Email ou senha incorretos!'
                })
            }


            res.status(200).json({

                message:
                    'Login com sucesso',

                usuario: {

                    id:
                        usuario.id_usuario,

                    nome:
                        usuario.nome,

                    email:
                        usuario.email
                }
            })
        }
    )
})


// =========================================================
// METAS
// =========================================================


// =========================================================
// CRIAR META
// =========================================================

app.post('/api/metas', (req, res) => {

    const {
        id_usuario,
        titulo,
        valor_alvo,
        valor_atual,
        cor_destaque
    } = req.body


    if (
        !id_usuario ||
        !titulo ||
        !valor_alvo
    ) {

        return res.status(400).json({
            message:
                'Preencha os campos obrigatórios.'
        })
    }


    const valorInicial =
        Number(
            valor_atual || 0
        )


    const valorObjetivo =
        Number(
            valor_alvo
        )


    // Evita valores inválidos.
    if (
        valorObjetivo <= 0 ||
        valorInicial < 0
    ) {

        return res.status(400).json({
            message:
                'Informe valores válidos para a meta.'
        })
    }


    // O status é automático.
    //
    // Se já tem dinheiro suficiente,
    // começa concluída.
    const status =
        valorInicial >= valorObjetivo
            ? 'concluida'
            : 'em_andamento'


    const sql = `
        INSERT INTO metas
        (
            id_usuario,
            titulo,
            valor_alvo,
            valor_atual,
            cor_destaque,
            status
        )

        VALUES (?, ?, ?, ?, ?, ?)
    `


    db.query(
        sql,

        [
            id_usuario,
            titulo,
            valorObjetivo,
            valorInicial,
            cor_destaque || '#75ff00',
            status
        ],

        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                })
            }


            res.status(201).json({

                message:
                    'Meta criada com sucesso!',

                id_meta:
                    result.insertId
            })
        }
    )
})


// =========================================================
// LISTAR METAS DO USUÁRIO
// =========================================================

app.get(
    '/api/metas/:id_usuario',
    (req, res) => {

        const {
            id_usuario
        } = req.params


        const sql = `
            SELECT *

            FROM metas

            WHERE id_usuario = ?

            AND status != 'resgatada'

            ORDER BY id_meta DESC
        `


        db.query(
            sql,
            [id_usuario],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json(
                    results
                )
            }
        )
    }
)


// =========================================================
// ADICIONAR VALOR À META
// =========================================================

app.put(
    '/api/metas/adicionar-valor/:id_meta',

    (req, res) => {

        const {
            id_meta
        } = req.params


        const {
            valor
        } = req.body


        const valorAdicionar =
            Number(valor)


        if (
            !valorAdicionar ||
            valorAdicionar <= 0
        ) {

            return res.status(400).json({
                message:
                    'Informe um valor válido.'
            })
        }


        // Primeiro procuramos a meta.
        const sqlBuscar = `
            SELECT
                valor_atual,
                valor_alvo,
                status

            FROM metas

            WHERE id_meta = ?
        `


        db.query(
            sqlBuscar,
            [id_meta],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            'Meta não encontrada.'
                    })
                }


                const meta =
                    results[0]


                const valorAtual =
                    Number(
                        meta.valor_atual
                    )


                const valorAlvo =
                    Number(
                        meta.valor_alvo
                    )


                // Soma o novo valor.
                let novoValor =
                    valorAtual +
                    valorAdicionar


                // Não deixamos ultrapassar
                // o objetivo.
                //
                // Exemplo:
                //
                // Meta = 5000
                // Atual = 4800
                // Adiciona = 500
                //
                // Resultado = 5000.
                if (
                    novoValor >
                    valorAlvo
                ) {

                    novoValor =
                        valorAlvo
                }


                // Status automático.
                const novoStatus =
                    novoValor >= valorAlvo
                        ? 'concluida'
                        : 'em_andamento'


                const sqlAtualizar = `
                    UPDATE metas

                    SET
                        valor_atual = ?,
                        status = ?

                    WHERE id_meta = ?
                `


                db.query(
                    sqlAtualizar,

                    [
                        novoValor,
                        novoStatus,
                        id_meta
                    ],

                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                error:
                                    err.message
                            })
                        }


                        res.status(200).json({

                            message:
                                novoStatus ===
                                'concluida'

                                    ? 'Valor adicionado e meta concluída!'

                                    : 'Valor adicionado com sucesso!',

                            valor_atual:
                                novoValor,

                            status:
                                novoStatus
                        })
                    }
                )
            }
        )
    }
)


// =========================================================
// RETIRAR VALOR DA META
// =========================================================
//
// Essa lógica substitui o antigo "resgatar".
//
// Agora o usuário pode usar uma parte
// do dinheiro guardado sem excluir a meta.
//
// Exemplo:
//
// Reserva:
//
// R$ 5.000 / R$ 5.000
//
// Usuário usou R$ 700.
//
// Depois:
//
// R$ 4.300 / R$ 5.000
//
// A meta automaticamente volta para
// "em andamento".
// =========================================================

app.put(
    '/api/metas/retirar-valor/:id_meta',

    (req, res) => {

        const {
            id_meta
        } = req.params


        const {
            valor
        } = req.body


        const valorRetirar =
            Number(valor)


        if (
            !valorRetirar ||
            valorRetirar <= 0
        ) {

            return res.status(400).json({
                message:
                    'Informe um valor válido para retirada.'
            })
        }


        // Busca a meta.
        const sqlBuscar = `
            SELECT
                valor_atual,
                valor_alvo,
                status

            FROM metas

            WHERE id_meta = ?
        `


        db.query(
            sqlBuscar,
            [id_meta],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                if (
                    results.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            'Meta não encontrada.'
                    })
                }


                const meta =
                    results[0]


                const valorAtual =
                    Number(
                        meta.valor_atual
                    )


                const valorAlvo =
                    Number(
                        meta.valor_alvo
                    )


                // Não há dinheiro para retirar.
                if (
                    valorAtual <= 0
                ) {

                    return res.status(400).json({

                        message:
                            'Esta meta não possui valor disponível para retirada.'
                    })
                }


                // Não pode retirar mais
                // do que existe.
                if (
                    valorRetirar >
                    valorAtual
                ) {

                    return res.status(400).json({

                        message:
                            'O valor da retirada não pode ser maior que o valor guardado.'
                    })
                }


                // Realiza a retirada.
                const novoValor =
                    valorAtual -
                    valorRetirar


                // Depois da retirada,
                // o status também é recalculado.
                const novoStatus =
                    novoValor >= valorAlvo
                        ? 'concluida'
                        : 'em_andamento'


                const sqlAtualizar = `
                    UPDATE metas

                    SET
                        valor_atual = ?,
                        status = ?

                    WHERE id_meta = ?
                `


                db.query(
                    sqlAtualizar,

                    [
                        novoValor,
                        novoStatus,
                        id_meta
                    ],

                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                error:
                                    err.message
                            })
                        }


                        res.status(200).json({

                            message:
                                'Valor retirado com sucesso!',

                            valor_atual:
                                novoValor,

                            status:
                                novoStatus
                        })
                    }
                )
            }
        )
    }
)


// =========================================================
// EDITAR META
// =========================================================

app.put(
    '/api/metas/:id_meta',

    (req, res) => {

        const {
            id_meta
        } = req.params


        const {
            titulo,
            valor_alvo,
            valor_atual,
            cor_destaque
        } = req.body


        const valorObjetivo =
            Number(
                valor_alvo
            )


        const valorGuardado =
            Number(
                valor_atual
            )


        if (
            !titulo ||
            valorObjetivo <= 0 ||
            valorGuardado < 0
        ) {

            return res.status(400).json({

                message:
                    'Informe dados válidos para a meta.'
            })
        }


        // O status também é
        // recalculado durante edição.
        const status =
            valorGuardado >= valorObjetivo
                ? 'concluida'
                : 'em_andamento'


        const sql = `
            UPDATE metas

            SET
                titulo = ?,
                valor_alvo = ?,
                valor_atual = ?,
                cor_destaque = ?,
                status = ?

            WHERE id_meta = ?
        `


        db.query(
            sql,

            [
                titulo,
                valorObjetivo,
                valorGuardado,
                cor_destaque || '#75ff00',
                status,
                id_meta
            ],

            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            'Meta não encontrada.'
                    })
                }


                res.status(200).json({

                    message:
                        'Meta atualizada com sucesso!'
                })
            }
        )
    }
)


// =========================================================
// EXCLUIR META
// =========================================================

app.delete(
    '/api/metas/:id_meta',

    (req, res) => {

        const {
            id_meta
        } = req.params


        const sql = `
            DELETE FROM metas
            WHERE id_meta = ?
        `


        db.query(
            sql,
            [id_meta],

            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({

                        message:
                            'Meta não encontrada.'
                    })
                }


                res.status(200).json({

                    message:
                        'Meta excluída com sucesso!'
                })
            }
        )
    }
)


// =========================================================
// TRANSAÇÕES
// =========================================================


// =========================================================
// CRIAR TRANSAÇÃO
// =========================================================

app.post(
    '/api/transacoes',

    (req, res) => {

        const {
            id_usuario,
            id_categoria,
            valor,
            descricao,
            data_transacao
        } = req.body


        if (
            !id_usuario ||
            !id_categoria ||
            !valor ||
            !descricao ||
            !data_transacao
        ) {

            return res.status(400).json({

                message:
                    'Preencha todos os campos.'
            })
        }


        const sql = `
            INSERT INTO transacoes
            (
                id_usuario,
                id_categoria,
                valor,
                descricao,
                data_transacao
            )

            VALUES (?, ?, ?, ?, ?)
        `


        db.query(
            sql,

            [
                id_usuario,
                id_categoria,
                valor,
                descricao,
                data_transacao
            ],

            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(201).json({

                    message:
                        'Transação criada com sucesso!',

                    id_transacao:
                        result.insertId
                })
            }
        )
    }
)


// =========================================================
// LISTAR TRANSAÇÕES
// =========================================================

app.get(
    '/api/transacoes/:id_usuario',

    (req, res) => {

        const {
            id_usuario
        } = req.params


        const sql = `
            SELECT

                t.id_transacao,
                t.valor,
                t.descricao,
                t.data_transacao,

                c.nome AS categoria,

                c.tipo

            FROM transacoes t

            JOIN categorias c
                ON t.id_categoria = c.id_categoria

            WHERE t.id_usuario = ?

            ORDER BY t.data_transacao DESC
        `


        db.query(
            sql,
            [id_usuario],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json(
                    results
                )
            }
        )
    }
)


// =========================================================
// EDITAR TRANSAÇÃO
// =========================================================

app.put(
    '/api/transacoes/:id_transacao',

    (req, res) => {

        const {
            id_transacao
        } = req.params


        const {
            id_categoria,
            valor,
            descricao,
            data_transacao
        } = req.body


        const sql = `
            UPDATE transacoes

            SET
                id_categoria = ?,
                valor = ?,
                descricao = ?,
                data_transacao = ?

            WHERE id_transacao = ?
        `


        db.query(
            sql,

            [
                id_categoria,
                valor,
                descricao,
                data_transacao,
                id_transacao
            ],

            (err) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json({

                    message:
                        'Transação atualizada com sucesso!'
                })
            }
        )
    }
)


// =========================================================
// EXCLUIR TRANSAÇÃO
// =========================================================

app.delete(
    '/api/transacoes/:id_transacao',

    (req, res) => {

        const {
            id_transacao
        } = req.params


        const sql = `
            DELETE FROM transacoes
            WHERE id_transacao = ?
        `


        db.query(
            sql,
            [id_transacao],

            (err) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json({

                    message:
                        'Transação excluída com sucesso!'
                })
            }
        )
    }
)


// =========================================================
// CATEGORIAS
// =========================================================

app.get(
    '/api/categorias',

    (req, res) => {

        const sql = `
            SELECT *
            FROM categorias
            ORDER BY tipo, nome
        `


        db.query(
            sql,

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json(
                    results
                )
            }
        )
    }
)


// =========================================================
// DASHBOARD
// =========================================================


// =========================================================
// RESUMO FINANCEIRO
// =========================================================

app.get(
    '/api/dashboard/:id_usuario',

    (req, res) => {

        const {
            id_usuario
        } = req.params


        const sql = `
            SELECT

                IFNULL(
                    SUM(
                        CASE

                            WHEN c.tipo = 'receita'
                            THEN t.valor

                            ELSE 0

                        END
                    ),

                    0

                ) AS total_receitas,


                IFNULL(
                    SUM(
                        CASE

                            WHEN c.tipo = 'despesa'
                            THEN t.valor

                            ELSE 0

                        END
                    ),

                    0

                ) AS total_despesas


            FROM transacoes t


            JOIN categorias c

                ON t.id_categoria =
                    c.id_categoria


            WHERE t.id_usuario = ?
        `


        db.query(
            sql,
            [id_usuario],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                const totalReceitas =
                    Number(
                        results[0]
                            .total_receitas
                    )


                const totalDespesas =
                    Number(
                        results[0]
                            .total_despesas
                    )


                res.status(200).json({

                    total_receitas:
                        totalReceitas,

                    total_despesas:
                        totalDespesas,

                    saldo:
                        totalReceitas -
                        totalDespesas
                })
            }
        )
    }
)


// =========================================================
// GASTOS POR CATEGORIA
// =========================================================

app.get(

    '/api/dashboard/:id_usuario/gastos-categoria',

    (req, res) => {

        const {
            id_usuario
        } = req.params


        const sql = `
            SELECT

                c.nome AS categoria,

                IFNULL(
                    SUM(t.valor),
                    0
                ) AS total


            FROM transacoes t


            JOIN categorias c

                ON t.id_categoria =
                    c.id_categoria


            WHERE t.id_usuario = ?

            AND c.tipo = 'despesa'


            GROUP BY
                c.id_categoria,
                c.nome


            ORDER BY total DESC
        `


        db.query(
            sql,
            [id_usuario],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json(
                    results
                )
            }
        )
    }
)


// =========================================================
// GASTOS MENSAIS
// =========================================================

app.get(

    '/api/dashboard/:id_usuario/gastos-mensais',

    (req, res) => {

        const {
            id_usuario
        } = req.params


        const sql = `
            SELECT

                YEAR(t.data_transacao)
                    AS ano,

                MONTH(t.data_transacao)
                    AS mes,

                IFNULL(
                    SUM(t.valor),
                    0
                ) AS total


            FROM transacoes t


            JOIN categorias c

                ON t.id_categoria =
                    c.id_categoria


            WHERE t.id_usuario = ?

            AND c.tipo = 'despesa'


            GROUP BY

                YEAR(
                    t.data_transacao
                ),

                MONTH(
                    t.data_transacao
                )


            ORDER BY
                ano,
                mes
        `


        db.query(
            sql,
            [id_usuario],

            (err, results) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    })
                }


                res.status(200).json(
                    results
                )
            }
        )
    }
)


// =========================================================
// SERVIDOR
// =========================================================

const PORT = 3000


app.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        )
    }
)