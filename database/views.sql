USE oinksafe_db;

CREATE OR REPLACE VIEW vw_extrato_detalhado AS
SELECT
    t.id_transacao,
    u.nome AS utilizador,
    c.nome AS categoria,
    c.tipo AS tipo_movimento,
    t.descricao,
    t.valor,
    DATE_FORMAT(t.data_transacao, '%d/%m/%Y') AS data_formatada
FROM transacoes t
JOIN categorias c ON t.id_categoria = c.id_categoria
JOIN usuarios u ON t.id_usuario = u.id_usuario
ORDER BY t.data_transacao DESC;

CREATE OR REPLACE VIEW vw_progresso_metas AS
SELECT
    id_meta,
    id_usuario,
    titulo AS objetivo,
    valor_alvo,
    valor_atual,
    ROUND((valor_atual / valor_alvo) * 100, 2) AS percentagem_concluida,
    cor_destaque,
    status
FROM metas;