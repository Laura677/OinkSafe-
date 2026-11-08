// ========================================
// OINKSAFE - BACKEND NODE.JS
// ========================================

const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const http = require('http')
const db = require('./db')

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

// ========================================
// INTEGRAÇÃO COM JAVA
// ========================================

const BADGES_API_KEY =
    process.env.BADGES_API_KEY || 'oinksafe-local-badges'

const BADGES_HOST = process.env.BADGES_HOST || '127.0.0.1'
const BADGES_PORT = Number(process.env.BADGES_PORT || 8080)

function chamarBadges(metodo, caminho) {

    return new Promise((resolve, reject) => {

        const pedido = http.request({

            hostname: BADGES_HOST,
            port: BADGES_PORT,
            path: caminho,
            method: metodo,

            headers: {
                'X-Badges-Key': BADGES_API_KEY
            }

        }, resposta => {

            let texto = ''

            resposta.on('data', parte => {
                texto += parte
            })

            resposta.on('end', () => {

                if (
                    resposta.statusCode < 200 ||
                    resposta.statusCode >= 300
                ) {
                    return reject(
                        new Error(`Erro Java: ${resposta.statusCode}`)
                    )
                }

                try {
                    resolve(texto ? JSON.parse(texto) : null)
                } catch (erro) {
                    reject(erro)
                }

            })

            resposta.on('error', reject)

        })

        pedido.setTimeout(5000, () => {
            pedido.destroy(new Error('Tempo limite do Java'))
        })

        pedido.on('error', reject)

        pedido.end()

    })

}

// ========================================
// CONSULTAS MYSQL
// ========================================

function consultarSQL(sql, parametros = []) {

    return new Promise((resolve, reject) => {

        db.query(sql, parametros, (erro, resultado) => {

            if (erro) {
                return reject(erro)
            }

            resolve(resultado)

        })

    })

}

// ========================================
// VALIDAR IDENTIFICADOR
// ========================================

function idValido(id) {

    const numero = Number(id)

    return Number.isSafeInteger(numero) && numero > 0

}

function valorValido(valor, permitirZero = false) {

    const numero = Number(valor)

    return (
        valor !== null &&
        valor !== undefined &&
        valor !== '' &&
        Number.isFinite(numero) &&
        (permitirZero ? numero >= 0 : numero > 0)
    )

}

// ========================================
// SINCRONIZAR AS SEIS BADGES
// ========================================

async function sincronizarBadges(idUsuario) {

    if (!idValido(idUsuario)) {
        throw new Error('Usuário inválido')
    }

    const id = Number(idUsuario)

    // Consulta transações existentes.

    const transacoes = await consultarSQL(

        `SELECT COUNT(*) AS total
         FROM transacoes
         WHERE id_usuario = ?`,

        [id]

    )

    // Consulta as metas financeiras.

    const metas = await consultarSQL(

        `SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(
                    CASE
                        WHEN valor_atual > 0
                        THEN 1 ELSE 0
                    END
                ), 0
            ) AS metas_com_dinheiro,

            COALESCE(
                MAX(
                    CASE
                        WHEN valor_alvo > 0
                        AND valor_atual >= valor_alvo * 0.5
                        THEN 1 ELSE 0
                    END
                ), 0
            ) AS metade_alcancada,

            COALESCE(
                MAX(
                    CASE
                        WHEN valor_alvo > 0
                        AND valor_atual >= valor_alvo
                        THEN 1 ELSE 0
                    END
                ), 0
            ) AS meta_concluida,

            COALESCE(
                SUM(valor_atual), 0
            ) AS total_guardado

         FROM metas
         WHERE id_usuario = ?`,

        [id]

    )

    const dadosTransacoes = transacoes[0]
    const dadosMetas = metas[0]

    const conquistas = []

    // BADGE 1 - PRIMEIROS PASSOS

    if (Number(dadosTransacoes.total) >= 1) {

        conquistas.push('primeira-transacao')

    }

    // BADGE 2 - PRIMEIRA META

    if (Number(dadosMetas.total) >= 1) {

        conquistas.push('primeira-meta')

    }

    // BADGE 3 - POUPADOR

    if (Number(dadosMetas.metas_com_dinheiro) >= 1) {

        conquistas.push('poupador')

    }

    // BADGE 4 - FOCO NO PLANO

    if (Number(dadosMetas.metade_alcancada) >= 1) {

        conquistas.push('foco-no-plano')

    }

    // BADGE 5 - META CONCLUÍDA

    if (Number(dadosMetas.meta_concluida) >= 1) {

        conquistas.push('meta-concluida')

    }

    // BADGE 6 - COFRE CHEIO

    if (Number(dadosMetas.total_guardado) >= 1000) {

        conquistas.push('cofre-cheio')

    }

    // Envia as conquistas para o Java.

    for (const conquista of conquistas) {

        await chamarBadges(

            'POST',

            `/api/interno/conquistas/${id}/${conquista}`

        )

    }

    return conquistas

}

// ========================================
// SINCRONIZAÇÃO SEM BLOQUEAR OPERAÇÕES
// ========================================

function sincronizarSemBloquear(idUsuario) {

    sincronizarBadges(idUsuario).catch(erro => {

        console.warn(
            'Sincronização de badges pendente:',
            erro.message
        )

    })

}

// ========================================
// ROTA PRINCIPAL
// ========================================

app.get('/', (req, res) => {

    res.json({
        status: 'ok',
        mensagem: 'API OinkSafe funcionando'
    })

})

// ========================================
// CADASTRAR USUÁRIO
// ========================================

app.post('/api/registrar', async (req, res) => {

    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {

        return res.status(400).json({
            message: 'Preencha todos os campos.'
        })

    }

    try {

        const usuarios = await consultarSQL(

            'SELECT id_usuario FROM usuarios WHERE email = ?',

            [email]

        )

        if (usuarios.length > 0) {

            return res.status(400).json({
                message: 'Este email já está cadastrado!'
            })

        }

        const hashSenha = await bcrypt.hash(senha, 10)

        await consultarSQL(

            `INSERT INTO usuarios
             (nome, email, senha)
             VALUES (?, ?, ?)`,

            [nome, email, hashSenha]

        )

        res.status(201).json({
            message: 'Cadastro realizado com sucesso!'
        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// LOGIN
// ========================================

app.post('/api/login', async (req, res) => {

    const { email, senha } = req.body

    if (!email || !senha) {

        return res.status(400).json({
            message: 'Preencha email e senha.'
        })

    }

    try {

        const usuarios = await consultarSQL(

            'SELECT * FROM usuarios WHERE email = ?',

            [email]

        )

        if (usuarios.length === 0) {

            return res.status(400).json({
                message: 'Email ou senha incorretos!'
            })

        }

        const usuario = usuarios[0]

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        )

        if (!senhaValida) {

            return res.status(400).json({
                message: 'Email ou senha incorretos!'
            })

        }

        res.status(200).json({

            message: 'Login com sucesso',

            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email
            }

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})
// ========================================
// EDITAR PERFIL DO USUÁRIO
// ========================================

app.put('/api/usuarios/:id_usuario/perfil', async (req, res) => {

    const idUsuario = Number(req.params.id_usuario)
    const nome = typeof req.body.nome === 'string'
        ? req.body.nome.trim()
        : ''

    if (!idValido(idUsuario)) {
        return res.status(400).json({
            message: 'Usuário inválido.'
        })
    }

    if (nome.length < 2 || nome.length > 100) {
        return res.status(400).json({
            message: 'O nome deve ter entre 2 e 100 caracteres.'
        })
    }

    try {

        const resultado = await consultarSQL(
            'UPDATE usuarios SET nome = ? WHERE id_usuario = ?',
            [nome, idUsuario]
        )

        if (!resultado.affectedRows) {
            return res.status(404).json({
                message: 'Usuário não encontrado.'
            })
        }

        const usuarios = await consultarSQL(
            'SELECT id_usuario, nome, email FROM usuarios WHERE id_usuario = ?',
            [idUsuario]
        )

        const usuario = usuarios[0]

        res.json({
            message: 'Perfil atualizado com sucesso!',
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email
            }
        })

    } catch (erro) {

        console.error('Erro ao atualizar perfil:', erro)

        res.status(500).json({
            message: 'Não foi possível atualizar o perfil.'
        })

    }

})
// ========================================
// CRIAR META
// ========================================

app.post('/api/metas', async (req, res) => {

    const {
        id_usuario,
        titulo,
        valor_alvo,
        valor_atual,
        cor_destaque
    } = req.body

    if (
        !idValido(id_usuario) ||
        !titulo ||
        !valorValido(valor_alvo) ||
        !valorValido(valor_atual ?? 0, true)
    ) {

        return res.status(400).json({
            message: 'Informe dados válidos para a meta.'
        })

    }

    const objetivo = Number(valor_alvo)
    const atual = Number(valor_atual ?? 0)

    const status =
        atual >= objetivo ? 'concluida' : 'em_andamento'

    try {

        const resultado = await consultarSQL(

            `INSERT INTO metas
             (
                id_usuario,
                titulo,
                valor_alvo,
                valor_atual,
                cor_destaque,
                status
             )
             VALUES (?, ?, ?, ?, ?, ?)`,

            [
                id_usuario,
                titulo,
                objetivo,
                atual,
                cor_destaque || '#75ff00',
                status
            ]

        )

        sincronizarSemBloquear(id_usuario)

        res.status(201).json({

            message: 'Meta criada com sucesso!',
            id_meta: resultado.insertId

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// LISTAR METAS
// ========================================

app.get('/api/metas/:id_usuario', async (req, res) => {

    try {

        const metas = await consultarSQL(

            `SELECT *
             FROM metas
             WHERE id_usuario = ?
             AND status != 'resgatada'
             ORDER BY id_meta DESC`,

            [req.params.id_usuario]

        )

        res.json(metas)

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// ADICIONAR DINHEIRO À META
// ========================================

app.put('/api/metas/adicionar-valor/:id_meta', async (req, res) => {

    const { id_meta } = req.params
    const valor = Number(req.body.valor)

    if (!valorValido(req.body.valor)) {

        return res.status(400).json({
            message: 'Informe um valor válido.'
        })

    }

    try {

        const metas = await consultarSQL(

            `SELECT *
             FROM metas
             WHERE id_meta = ?`,

            [id_meta]

        )

        if (metas.length === 0) {

            return res.status(404).json({
                message: 'Meta não encontrada.'
            })

        }

        const meta = metas[0]

        const novoValor = Math.min(

            Number(meta.valor_atual) + valor,

            Number(meta.valor_alvo)

        )

        const novoStatus =
            novoValor >= Number(meta.valor_alvo)
                ? 'concluida'
                : 'em_andamento'

        await consultarSQL(

            `UPDATE metas
             SET valor_atual = ?, status = ?
             WHERE id_meta = ?`,

            [novoValor, novoStatus, id_meta]

        )

        sincronizarSemBloquear(meta.id_usuario)

        res.json({

            message:
                novoStatus === 'concluida'
                    ? 'Valor adicionado e meta concluída!'
                    : 'Valor adicionado com sucesso!',

            valor_atual: novoValor,
            status: novoStatus

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// RETIRAR DINHEIRO DA META
// ========================================

app.put('/api/metas/retirar-valor/:id_meta', async (req, res) => {

    const { id_meta } = req.params
    const valor = Number(req.body.valor)

    if (!valorValido(req.body.valor)) {

        return res.status(400).json({
            message: 'Informe um valor válido para retirada.'
        })

    }

    try {

        const metas = await consultarSQL(

            'SELECT * FROM metas WHERE id_meta = ?',

            [id_meta]

        )

        if (!metas.length) {

            return res.status(404).json({
                message: 'Meta não encontrada.'
            })

        }

        const meta = metas[0]

        if (valor > Number(meta.valor_atual)) {

            return res.status(400).json({
                message: 'O valor da retirada não pode ser maior que o valor guardado.'
            })

        }

        const novoValor = Number(meta.valor_atual) - valor

        const status =
            novoValor >= Number(meta.valor_alvo)
                ? 'concluida'
                : 'em_andamento'

        await consultarSQL(

            `UPDATE metas
             SET valor_atual = ?, status = ?
             WHERE id_meta = ?`,

            [novoValor, status, id_meta]

        )

        res.json({

            message: 'Valor retirado com sucesso!',
            valor_atual: novoValor,
            status

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// EDITAR META
// ========================================

app.put('/api/metas/:id_meta', async (req, res) => {

    const { id_meta } = req.params

    const {
        titulo,
        valor_alvo,
        valor_atual,
        cor_destaque
    } = req.body

    if (
        !titulo ||
        !valorValido(valor_alvo) ||
        !valorValido(valor_atual, true)
    ) {

        return res.status(400).json({
            message: 'Informe dados válidos para a meta.'
        })

    }

    const objetivo = Number(valor_alvo)
    const atual = Number(valor_atual)

    const status =
        atual >= objetivo ? 'concluida' : 'em_andamento'

    try {

        const metas = await consultarSQL(

            'SELECT id_usuario FROM metas WHERE id_meta = ?',

            [id_meta]

        )

        if (!metas.length) {

            return res.status(404).json({
                message: 'Meta não encontrada.'
            })

        }

        await consultarSQL(

            `UPDATE metas
             SET titulo = ?,
                 valor_alvo = ?,
                 valor_atual = ?,
                 cor_destaque = ?,
                 status = ?
             WHERE id_meta = ?`,

            [
                titulo,
                objetivo,
                atual,
                cor_destaque || '#75ff00',
                status,
                id_meta
            ]

        )

        sincronizarSemBloquear(metas[0].id_usuario)

        res.json({
            message: 'Meta atualizada com sucesso!'
        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// EXCLUIR META
// ========================================

app.delete('/api/metas/:id_meta', async (req, res) => {

    try {

        const resultado = await consultarSQL(

            'DELETE FROM metas WHERE id_meta = ?',

            [req.params.id_meta]

        )

        if (!resultado.affectedRows) {

            return res.status(404).json({
                message: 'Meta não encontrada.'
            })

        }

        res.json({
            message: 'Meta excluída com sucesso!'
        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// CRIAR TRANSAÇÃO
// ========================================

app.post('/api/transacoes', async (req, res) => {

    const {
        id_usuario,
        id_categoria,
        valor,
        descricao,
        data_transacao
    } = req.body

    if (
        !idValido(id_usuario) ||
        !idValido(id_categoria) ||
        !valorValido(valor) ||
        !descricao ||
        !data_transacao
    ) {

        return res.status(400).json({
            message: 'Preencha todos os campos corretamente.'
        })

    }

    try {

        const resultado = await consultarSQL(

            `INSERT INTO transacoes
             (
                id_usuario,
                id_categoria,
                valor,
                descricao,
                data_transacao
             )
             VALUES (?, ?, ?, ?, ?)`,

            [
                id_usuario,
                id_categoria,
                valor,
                descricao,
                data_transacao
            ]

        )

        let badge = null
        let badge_status = 'sincronizada'

        try {

            await sincronizarBadges(id_usuario)

            const conquistas = await chamarBadges(

                'GET',

                `/api/interno/conquistas/${Number(id_usuario)}`

            )

            badge = conquistas.find(
                conquista =>
                    conquista.badgeId === 'primeira_transacao'
            ) || null

        } catch (erro) {

            badge_status = 'pendente'

            console.warn(
                'Transação salva; badges pendentes:',
                erro.message
            )

        }

        res.status(201).json({

            message: 'Transação criada com sucesso!',
            id_transacao: resultado.insertId,
            badge_status,
            badge

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// LISTAR TRANSAÇÕES
// ========================================

app.get('/api/transacoes/:id_usuario', async (req, res) => {

    try {

        const transacoes = await consultarSQL(

            `SELECT
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
             ORDER BY t.data_transacao DESC`,

            [req.params.id_usuario]

        )

        res.json(transacoes)

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// EDITAR TRANSAÇÃO
// ========================================

app.put('/api/transacoes/:id_transacao', async (req, res) => {

    const {
        id_categoria,
        valor,
        descricao,
        data_transacao
    } = req.body

    try {

        const resultado = await consultarSQL(

            `UPDATE transacoes
             SET id_categoria = ?,
                 valor = ?,
                 descricao = ?,
                 data_transacao = ?
             WHERE id_transacao = ?`,

            [
                id_categoria,
                valor,
                descricao,
                data_transacao,
                req.params.id_transacao
            ]

        )

        if (!resultado.affectedRows) {

            return res.status(404).json({
                message: 'Transação não encontrada.'
            })

        }

        res.json({
            message: 'Transação atualizada com sucesso!'
        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// EXCLUIR TRANSAÇÃO
// ========================================

app.delete('/api/transacoes/:id_transacao', async (req, res) => {

    try {

        const resultado = await consultarSQL(

            'DELETE FROM transacoes WHERE id_transacao = ?',

            [req.params.id_transacao]

        )

        if (!resultado.affectedRows) {

            return res.status(404).json({
                message: 'Transação não encontrada.'
            })

        }

        res.json({
            message: 'Transação excluída com sucesso!'
        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// CATEGORIAS
// ========================================

app.get('/api/categorias', async (req, res) => {

    try {

        const categorias = await consultarSQL(

            `SELECT *
             FROM categorias
             ORDER BY tipo, nome`

        )

        res.json(categorias)

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// DASHBOARD - RESUMO FINANCEIRO
// ========================================

app.get('/api/dashboard/:id_usuario', async (req, res) => {

    try {

        const resultados = await consultarSQL(

            `SELECT

                COALESCE(
                    SUM(
                        CASE
                            WHEN c.tipo = 'receita'
                            THEN t.valor
                            ELSE 0
                        END
                    ), 0
                ) AS total_receitas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN c.tipo = 'despesa'
                            THEN t.valor
                            ELSE 0
                        END
                    ), 0
                ) AS total_despesas

             FROM transacoes t

             JOIN categorias c
                ON t.id_categoria = c.id_categoria

             WHERE t.id_usuario = ?`,

            [req.params.id_usuario]

        )

        const receitas = Number(
            resultados[0].total_receitas
        )

        const despesas = Number(
            resultados[0].total_despesas
        )

        res.json({

            total_receitas: receitas,
            total_despesas: despesas,
            saldo: receitas - despesas

        })

    } catch (erro) {

        res.status(500).json({
            error: erro.message
        })

    }

})

// ========================================
// DASHBOARD - GASTOS POR CATEGORIA
// ========================================

app.get(
    '/api/dashboard/:id_usuario/gastos-categoria',
    async (req, res) => {

        try {

            const resultados = await consultarSQL(

                `SELECT
                    c.nome AS categoria,
                    COALESCE(SUM(t.valor), 0) AS total

                 FROM transacoes t

                 JOIN categorias c
                    ON t.id_categoria = c.id_categoria

                 WHERE t.id_usuario = ?
                 AND c.tipo = 'despesa'

                 GROUP BY
                    c.id_categoria,
                    c.nome

                 ORDER BY total DESC`,

                [req.params.id_usuario]

            )

            res.json(resultados)

        } catch (erro) {

            res.status(500).json({
                error: erro.message
            })

        }

    }
)

// ========================================
// DASHBOARD - GASTOS MENSAIS
// ========================================

app.get(
    '/api/dashboard/:id_usuario/gastos-mensais',
    async (req, res) => {

        try {

            const resultados = await consultarSQL(

                `SELECT
                    YEAR(t.data_transacao) AS ano,
                    MONTH(t.data_transacao) AS mes,
                    COALESCE(SUM(t.valor), 0) AS total

                 FROM transacoes t

                 JOIN categorias c
                    ON t.id_categoria = c.id_categoria

                 WHERE t.id_usuario = ?
                 AND c.tipo = 'despesa'

                 GROUP BY
                    YEAR(t.data_transacao),
                    MONTH(t.data_transacao)

                 ORDER BY ano, mes`,

                [req.params.id_usuario]

            )

            res.json(resultados)

        } catch (erro) {

            res.status(500).json({
                error: erro.message
            })

        }

    }
)

// ========================================
// LISTAR BADGES DO USUÁRIO
// ========================================

app.get('/api/badges/:id_usuario', async (req, res) => {

    const idUsuario = Number(req.params.id_usuario)

    if (!idValido(idUsuario)) {

        return res.status(400).json({
            message: 'Usuário inválido.'
        })

    }

    try {

        // Verifica se o usuário existe.

        const usuarios = await consultarSQL(

            `SELECT id_usuario
             FROM usuarios
             WHERE id_usuario = ?`,

            [idUsuario]

        )

        if (!usuarios.length) {

            return res.status(404).json({
                message: 'Usuário não encontrado.'
            })

        }

        // Verifica todas as conquistas.

        await sincronizarBadges(idUsuario)

        // Consulta o MongoDB através do Java.

        const conquistas = await chamarBadges(

            'GET',

            `/api/interno/conquistas/${idUsuario}`

        )

        res.json(conquistas)

    } catch (erro) {

        console.error(
            'Erro ao consultar badges:',
            erro.message
        )

        res.status(503).json({

            message:
                'Badges indisponíveis. Tente novamente em instantes.'

        })

    }

})

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {

    console.log(
        `Servidor OinkSafe rodando na porta ${PORT}`
    )

})