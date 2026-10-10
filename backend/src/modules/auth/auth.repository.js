import { pool } from "../../config/database.js";


/*
    ============================================
    BUSCAR USUÁRIO PELO E-MAIL
    ============================================
*/

/*
    Procura um usuário pelo endereço de e-mail.

    O executor pode ser:
    - o pool geral;
    - uma conexão de uma transação.
*/
export async function buscarUsuarioPorEmail(
    email,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                nome,
                email,
                papel,
                status,
                email_verificado_em,
                ultimo_login_em,
                criado_em,
                atualizado_em
            FROM usuarios
            WHERE email = ?
            LIMIT 1
        `,
        [email]
    );

    /*
        Retorna o primeiro usuário encontrado.

        Se nenhum usuário existir, retorna null.
    */
    return linhas[0] ?? null;
}


/*
    ============================================
    INSERIR USUÁRIO
    ============================================
*/

/*
    Insere os dados principais do usuário.

    A conexão é recebida pelo service para que
    esta operação faça parte de uma transação.
*/
export async function inserirUsuario(
    conexao,
    {
        id,
        nome,
        email
    }
) {
    await conexao.execute(
        `
            INSERT INTO usuarios (
                id,
                nome,
                email,
                papel,
                status
            )
            VALUES (?, ?, ?, 'cliente', 'ativo')
        `,
        [
            id,
            nome,
            email
        ]
    );
}


/*
    ============================================
    INSERIR CREDENCIAL LOCAL
    ============================================
*/

/*
    Insere somente o hash da senha.

    A senha original nunca deve chegar
    ao repositório ou ao banco.
*/
export async function inserirCredencialLocal(
    conexao,
    {
        usuarioId,
        senhaHash
    }
) {
    await conexao.execute(
        `
            INSERT INTO credenciais_locais (
                usuario_id,
                senha_hash
            )
            VALUES (?, ?)
        `,
        [
            usuarioId,
            senhaHash
        ]
    );
}


/*
    ============================================
    BUSCAR CREDENCIAL PARA O LOGIN
    ============================================
*/

/*
    Busca o usuário e sua credencial local
    utilizando o endereço de e-mail.
*/
export async function buscarCredencialPorEmail(
    email,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                u.id,
                u.nome,
                u.email,
                u.papel,
                u.status,
                u.email_verificado_em,

                c.senha_hash,
                c.tentativas_login,
                c.bloqueado_ate

            FROM usuarios AS u

            LEFT JOIN credenciais_locais AS c
                ON c.usuario_id = u.id

            WHERE u.email = ?

            LIMIT 1
        `,
        [email]
    );

    return linhas[0] ?? null;
}