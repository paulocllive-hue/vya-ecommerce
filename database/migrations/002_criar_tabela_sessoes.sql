USE `vya_ecommerce`;

CREATE TABLE IF NOT EXISTS `sessoes` (
    /*
        Identificador interno da sessão.
    */
    `id` CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    /*
        Usuário proprietário da sessão.
    */
    `usuario_id` CHAR(36)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    /*
        SHA-256 do token enviado ao navegador.

        O token original nunca será armazenado
        no banco de dados.
    */
    `token_hash` CHAR(64)
        CHARACTER SET ascii
        COLLATE ascii_bin
        NOT NULL,

    /*
        Momento absoluto em que a sessão deixa
        de ser válida.
    */
    `expira_em` DATETIME(3) NOT NULL,

    /*
        Preenchido quando o usuário realiza logout
        ou a sessão é invalidada pelo sistema.
    */
    `revogada_em` DATETIME(3) NULL,

    /*
        Permite acompanhar a última utilização
        válida da sessão.
    */
    `ultimo_uso_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    `criado_em` DATETIME(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),

    /*
        Dois registros nunca poderão possuir
        o mesmo hash.
    */
    UNIQUE KEY `uq_sessoes_token_hash` (
        `token_hash`
    ),

    /*
        Facilita a busca das sessões pertencentes
        a determinado usuário.
    */
    KEY `idx_sessoes_usuario` (
        `usuario_id`,
        `revogada_em`
    ),

    /*
        Facilita a limpeza das sessões vencidas.
    */
    KEY `idx_sessoes_expiracao` (
        `expira_em`
    ),

    CONSTRAINT `fk_sessoes_usuario`
        FOREIGN KEY (`usuario_id`)
        REFERENCES `usuarios` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;