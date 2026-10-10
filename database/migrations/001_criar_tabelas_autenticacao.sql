USE `vya_ecommerce`;

CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    `nome` VARCHAR(120) NOT NULL,

    `email` VARCHAR(254) NOT NULL,

    `papel` VARCHAR(20)
        NOT NULL
        DEFAULT 'cliente',

    `status` VARCHAR(20)
        NOT NULL
        DEFAULT 'ativo',

    `email_verificado_em` DATETIME(3) NULL,

    `ultimo_login_em` DATETIME(3) NULL,

    `criado_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `atualizado_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_usuarios_email` (`email`),

    CONSTRAINT `chk_usuarios_papel`
        CHECK (`papel` IN ('cliente', 'administrador')),

    CONSTRAINT `chk_usuarios_status`
        CHECK (`status` IN ('ativo', 'bloqueado', 'inativo'))
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `credenciais_locais` (
    `usuario_id` CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    `senha_hash` VARCHAR(255) NOT NULL,

    `tentativas_login` SMALLINT UNSIGNED
        NOT NULL
        DEFAULT 0,

    `bloqueado_ate` DATETIME(3) NULL,

    `senha_alterada_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`usuario_id`),

    CONSTRAINT `fk_credenciais_usuario`
        FOREIGN KEY (`usuario_id`)
        REFERENCES `usuarios` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `identidades_oauth` (
    `id` BIGINT UNSIGNED
        NOT NULL
        AUTO_INCREMENT,

    `usuario_id` CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    `provedor` VARCHAR(30) NOT NULL,

    `provedor_usuario_id` VARCHAR(191) NOT NULL,

    `email_provedor` VARCHAR(254) NULL,

    `criado_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_oauth_provedor_usuario` (
        `provedor`,
        `provedor_usuario_id`
    ),

    KEY `idx_oauth_usuario_id` (`usuario_id`),

    CONSTRAINT `fk_oauth_usuario`
        FOREIGN KEY (`usuario_id`)
        REFERENCES `usuarios` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;