/*
    ============================================
    CATÁLOGO E CARRINHO - VYA
    ============================================
*/


/*
    Produtos principais da loja.
*/
CREATE TABLE IF NOT EXISTS produtos (
    id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    nome VARCHAR(150) NOT NULL,

    slug VARCHAR(180) NOT NULL,

    descricao TEXT NULL,

    categoria VARCHAR(80) NULL,

    ativo TINYINT(1)
        NOT NULL
        DEFAULT 1,

    criado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_produtos_slug (slug),

    KEY idx_produtos_ativo_categoria (
        ativo,
        categoria
    )
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/*
    Variações de cada produto.

    Exemplo:
    Produto: Conjunto Fitness VYA
    Variação: tamanho M, cor roxa
*/
CREATE TABLE IF NOT EXISTS produto_variantes (
    id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    produto_id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    sku VARCHAR(80)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    tamanho VARCHAR(20) NOT NULL,

    cor VARCHAR(60) NOT NULL,

    preco DECIMAL(10, 2)
        UNSIGNED
        NOT NULL,

    estoque INT
        UNSIGNED
        NOT NULL
        DEFAULT 0,

    imagem_url VARCHAR(500) NULL,

    ativo TINYINT(1)
        NOT NULL
        DEFAULT 1,

    criado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_produto_variantes_sku (sku),

    UNIQUE KEY uk_produto_variantes_opcao (
        produto_id,
        tamanho,
        cor
    ),

    KEY idx_variantes_produto (
        produto_id,
        ativo
    ),

    CONSTRAINT fk_variantes_produto
        FOREIGN KEY (produto_id)
        REFERENCES produtos (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/*
    Cada usuário possui um carrinho próprio.

    O carrinho permanece no banco mesmo depois
    que o usuário sai da conta.
*/
CREATE TABLE IF NOT EXISTS carrinhos (
    id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    usuario_id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    criado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_carrinhos_usuario (
        usuario_id
    ),

    CONSTRAINT fk_carrinhos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


/*
    Produtos e quantidades guardados no carrinho.
*/
CREATE TABLE IF NOT EXISTS carrinho_itens (
    id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    carrinho_id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    produto_variante_id CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    quantidade SMALLINT
        UNSIGNED
        NOT NULL
        DEFAULT 1,

    criado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_carrinho_item_variante (
        carrinho_id,
        produto_variante_id
    ),

    KEY idx_carrinho_itens_variante (
        produto_variante_id
    ),

    CONSTRAINT fk_carrinho_itens_carrinho
        FOREIGN KEY (carrinho_id)
        REFERENCES carrinhos (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_carrinho_itens_variante
        FOREIGN KEY (produto_variante_id)
        REFERENCES produto_variantes (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;