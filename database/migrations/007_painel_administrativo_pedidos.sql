USE vya_ecommerce;

/*
    Os status ficam como texto para que o fluxo do painel
    possa evoluir sem depender de alterar ENUM a cada etapa.
    A API continua aceitando somente ações previamente validadas.
*/
ALTER TABLE pedidos
    MODIFY COLUMN status VARCHAR(40)
        NOT NULL DEFAULT 'aguardando_pagamento',
    MODIFY COLUMN status_pagamento VARCHAR(30)
        NOT NULL DEFAULT 'pendente',
    MODIFY COLUMN status_entrega VARCHAR(40)
        NOT NULL;

/*
    Depois de executar esta migração, torne a sua própria conta
    administradora pela aba SQL do phpMyAdmin, substituindo o e-mail:

    UPDATE usuarios
    SET papel = 'admin'
    WHERE email = 'SEU_EMAIL_DE_LOGIN';
*/
