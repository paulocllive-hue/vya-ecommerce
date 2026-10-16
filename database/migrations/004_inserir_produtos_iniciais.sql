/*
    Produtos iniciais para desenvolvimento
    e testes do carrinho VYA.
*/

INSERT INTO produtos (
    id,
    nome,
    slug,
    descricao,
    categoria,
    ativo
)
VALUES
(
    '7f1a2c30-5b8d-4e61-9a20-000000000001',
    'Conjunto Fitness Vya',
    'conjunto-fitness-vya',
    'Conjunto fitness da marca Vya.',
    'Fitness',
    1
),
(
    '7f1a2c30-5b8d-4e61-9a20-000000000002',
    'Biquíni Vya Solar',
    'biquini-vya-solar',
    'Biquíni da linha Vya Solar.',
    'Moda praia',
    1
),
(
    '7f1a2c30-5b8d-4e61-9a20-000000000003',
    'Maiô Vya Movimento',
    'maio-vya-movimento',
    'Maiô da linha Vya Movimento.',
    'Natação',
    1
)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    categoria = VALUES(categoria),
    ativo = VALUES(ativo);


/*
    Uma variante provisória para cada produto.

    Depois adicionaremos tamanhos e cores reais.
*/

INSERT INTO produto_variantes (
    id,
    produto_id,
    sku,
    tamanho,
    cor,
    preco,
    estoque,
    imagem_url,
    ativo
)
VALUES
(
    '9d4e8b10-2c6f-47a3-b510-000000000001',
    '7f1a2c30-5b8d-4e61-9a20-000000000001',
    'VYA-FIT-001',
    'Único',
    'Padrão',
    149.90,
    20,
    NULL,
    1
),
(
    '9d4e8b10-2c6f-47a3-b510-000000000002',
    '7f1a2c30-5b8d-4e61-9a20-000000000002',
    'VYA-PRAIA-001',
    'Único',
    'Padrão',
    119.90,
    20,
    NULL,
    1
),
(
    '9d4e8b10-2c6f-47a3-b510-000000000003',
    '7f1a2c30-5b8d-4e61-9a20-000000000003',
    'VYA-NAT-001',
    'Único',
    'Padrão',
    139.90,
    20,
    NULL,
    1
)
ON DUPLICATE KEY UPDATE
    produto_id = VALUES(produto_id),
    tamanho = VALUES(tamanho),
    cor = VALUES(cor),
    preco = VALUES(preco),
    estoque = VALUES(estoque),
    ativo = VALUES(ativo);