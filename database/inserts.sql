USE oinksafe_db;

-- Inserir Utilizadores
INSERT INTO usuarios (nome, email, senha) VALUES 
('Administrador', 'admin@oinksafe.com', 'senha_criptografada_123'),
('Utilizador Teste', 'teste@oinksafe.com', 'senha_criptografada_456');


-- Inserir Categorias
INSERT INTO categorias (nome, tipo) VALUES 

-- Despesas
('Alimentação', 'despesa'),        -- ID 1
('Transporte', 'despesa'),         -- ID 2
('Lazer', 'despesa'),              -- ID 3
('Contas', 'despesa'),             -- ID 4
('Educação', 'despesa'),           -- ID 5

-- Receitas já utilizadas nas transações de teste
('Bolsa de Estágio', 'receita'),   -- ID 6
('Mesada', 'receita'),             -- ID 7

-- Novas categorias de receita
('Salário', 'receita'),            -- ID 8
('Estágio', 'receita'),            -- ID 9
('Freelance', 'receita'),          -- ID 10
('Vendas', 'receita'),             -- ID 11
('Comissões', 'receita'),          -- ID 12
('Investimentos', 'receita'),      -- ID 13
('Benefícios', 'receita'),         -- ID 14
('Reembolso', 'receita'),          -- ID 15
('Presente', 'receita'),           -- ID 16
('Renda Extra', 'receita'),        -- ID 17
('Outros', 'receita'),             -- ID 18

-- Novas categorias de despesa
('Saúde', 'despesa'),              -- ID 19
('Moradia', 'despesa'),            -- ID 20
('Compras', 'despesa'),            -- ID 21
('Assinaturas', 'despesa'),        -- ID 22
('Viagem', 'despesa'),             -- ID 23
('Outros', 'despesa');             -- ID 24


-- Inserir Transações

-- Receitas
INSERT INTO transacoes (
    id_usuario,
    id_categoria,
    valor,
    descricao,
    data_transacao
) VALUES 
(1, 6, 850.00, 'Bolsa de estágio em desenvolvimento Java', '2026-04-05'),
(1, 7, 150.00, 'Mesada', '2026-04-10');


-- Despesas
INSERT INTO transacoes (
    id_usuario,
    id_categoria,
    valor,
    descricao,
    data_transacao
) VALUES 
(1, 1, 25.50, 'Almoço perto da faculdade', '2026-04-12'),
(1, 2, 40.00, 'Passe de transportes', '2026-04-02'),
(1, 3, 50.00, 'Valorant Points (VP)', '2026-04-15'),
(1, 5, 120.00, 'Livro de Matemática Discreta e Lógica', '2026-04-18'),
(1, 1, 15.00, 'Lanche', '2026-04-20'),
(1, 4, 60.00, 'Fatura da Internet', '2026-04-22');


-- Inserir Metas
INSERT INTO metas (
    id_usuario,
    titulo,
    valor_alvo,
    valor_atual,
    cor_destaque,
    status
) VALUES 
(
    1,
    'Headset Redragon H510 Pro Zeus RGB Wireless',
    450.00,
    150.00,
    '#ff0000',
    'em_andamento'
),
(
    1,
    'Monitor Acer Nitro 144Hz',
    1200.00,
    400.00,
    '#0000ff',
    'em_andamento'
),
(
    1,
    'Box Light Novels Konosuba',
    200.00,
    80.00,
    '#00ff00',
    'em_andamento'
),
(
    1,
    'Presente especial para ela',
    300.00,
    300.00,
    '#ff1493',
    'concluida'
);