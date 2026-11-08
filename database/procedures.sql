USE oinksafe_db;

DROP PROCEDURE IF EXISTS sp_registar_transacao;

CREATE PROCEDURE sp_registar_transacao(
    IN p_id_usuario INT,
    IN p_id_categoria INT,
    IN p_valor DECIMAL(10,2),
    IN p_descricao VARCHAR(255),
    IN p_data_transacao DATE
)
BEGIN
    INSERT INTO transacoes (
        id_usuario,
        id_categoria,
        valor,
        descricao,
        data_transacao
    )
    VALUES (
        p_id_usuario,
        p_id_categoria,
        p_valor,
        p_descricao,
        p_data_transacao
    );
END;

DROP PROCEDURE IF EXISTS sp_relatorio_mensal;

CREATE PROCEDURE sp_relatorio_mensal(
    IN p_id_usuario INT,
    IN p_mes INT,
    IN p_ano INT
)
BEGIN
    SELECT
        u.nome AS Utilizador,
        CONCAT(LPAD(p_mes, 2, '0'), '/', p_ano) AS Periodo,

        IFNULL(
            SUM(
                CASE
                    WHEN c.tipo = 'receita' THEN t.valor
                    ELSE 0
                END
            ),
            0.00
        ) AS Total_Receitas,

        IFNULL(
            SUM(
                CASE
                    WHEN c.tipo = 'despesa' THEN t.valor
                    ELSE 0
                END
            ),
            0.00
        ) AS Total_Despesas,

        (
            IFNULL(
                SUM(
                    CASE
                        WHEN c.tipo = 'receita' THEN t.valor
                        ELSE 0
                    END
                ),
                0.00
            )
            -
            IFNULL(
                SUM(
                    CASE
                        WHEN c.tipo = 'despesa' THEN t.valor
                        ELSE 0
                    END
                ),
                0.00
            )
        ) AS Saldo_do_Mes

    FROM usuarios u

    LEFT JOIN transacoes t
        ON u.id_usuario = t.id_usuario
        AND MONTH(t.data_transacao) = p_mes
        AND YEAR(t.data_transacao) = p_ano

    LEFT JOIN categorias c
        ON t.id_categoria = c.id_categoria

    WHERE u.id_usuario = p_id_usuario

    GROUP BY
        u.id_usuario,
        u.nome;
END;