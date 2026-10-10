import { pool } from "../../config/database.js";

/*
    Procura um usuário pelo endereço de e-mail.

    O executor pode ser:
    - o pool;
    - uma conexão usada em uma transação.
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

    return linhas[0] ?? null;
}

/*
    Insere os dados principais do usuário.

    A conexão será recebida pelo service,
    pois o cadastro usará uma transação.
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
    Insere o hash da senha do usuário.

    A senha original nunca chega a esta função.
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