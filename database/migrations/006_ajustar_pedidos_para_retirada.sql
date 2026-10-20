USE vya_ecommerce;

/*
    Pedidos retirados no local não possuem
    endereço de entrega. Por isso, os campos
    do endereço precisam aceitar NULL.
*/
ALTER TABLE pedidos
    MODIFY COLUMN cep CHAR(8) NULL,
    MODIFY COLUMN logradouro VARCHAR(180) NULL,
    MODIFY COLUMN numero_endereco VARCHAR(20) NULL,
    MODIFY COLUMN bairro VARCHAR(100) NULL,
    MODIFY COLUMN cidade VARCHAR(100) NULL,
    MODIFY COLUMN estado CHAR(2) NULL;
