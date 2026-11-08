-- Active: 1788546996915@@127.0.0.1@3306@mysql
USE oinksafe_db;

-- Total Gasto por Categoria 
SELECT 
    c.nome AS Categoria, 
    SUM(t.valor) AS Total_Gasto 
FROM transacoes t
JOIN categorias c ON t.id_categoria = c.id_categoria
WHERE t.id_usuario = 1 AND c.tipo = 'despesa'
GROUP BY c.nome
ORDER BY Total_Gasto DESC;

-- As 5 Maiores Despesas do Utilizador
SELECT 
    t.descricao AS Descricao, 
    c.nome AS Categoria, 
    t.valor AS Valor, 
    DATE_FORMAT(t.data_transacao, '%d/%m/%Y') AS Data
FROM transacoes t
JOIN categorias c ON t.id_categoria = c.id_categoria
WHERE t.id_usuario = 1 AND c.tipo = 'despesa'
ORDER BY t.valor DESC
LIMIT 5;

-- Contagem de Metas por Status
SELECT 
    status AS Status_da_Meta, 
    COUNT(id_meta) AS Quantidade
FROM metas
WHERE id_usuario = 1
GROUP BY status
ORDER BY Quantidade DESC;

-- Média de Progresso Geral das Metas
SELECT 
    u.nome AS Utilizador, 
    ROUND(AVG((m.valor_atual / m.valor_alvo) * 100), 2) AS Media_Progresso_Geral_Porcento
FROM metas m
JOIN usuarios u ON m.id_usuario = u.id_usuario
GROUP BY u.id_usuario, u.nome;


-- Histórico de Transações Acima da Média
SELECT 
    t.descricao, 
    c.nome AS Categoria, 
    t.valor, 
    t.data_transacao
FROM transacoes t
JOIN categorias c ON t.id_categoria = c.id_categoria
WHERE t.id_usuario = 1 
  AND c.tipo = 'despesa'
  AND t.valor > (
      SELECT AVG(valor) 
      FROM transacoes 
      WHERE id_usuario = 1 AND id_categoria IN (SELECT id_categoria FROM categorias WHERE tipo = 'despesa')
  )
ORDER BY t.data_transacao DESC;
