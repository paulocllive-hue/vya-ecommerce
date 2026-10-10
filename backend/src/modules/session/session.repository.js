import { pool } from "../../config/database.js";


/*
    Insere uma nova sessão no banco.

    Somente o hash do token será armazenado.
*/
export async function inserirSessao(
    {
        id,
        usuarioId,
        tokenHash,
        expiraEm
    },
    executor = pool
) {
    await executor.execute(
        `
            INSERT INTO sessoes (
                id,
                usuario_id,
                token_hash,
                expira_em
            )
            VALUES (?, ?, ?, ?)
        `,
        [
            id,
            usuarioId,
            tokenHash,
            expiraEm
        ]
    );
}


/*
    Busca uma sessão válida pelo hash do token.

    A sessão precisa:
    - não estar revogada;
    - não estar expirada;
    - pertencer a um usuário ativo.
*/
export async function buscarSessaoValidaPorTokenHash(
    tokenHash,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                s.id AS sessao_id,
                s.usuario_id,
                s.expira_em,
                s.ultimo_uso_em,

                u.nome,
                u.email,
                u.papel,
                u.status

            FROM sessoes AS s

            INNER JOIN usuarios AS u
                ON u.id = s.usuario_id

            WHERE s.token_hash = ?
              AND s.revogada_em IS NULL
              AND s.expira_em > UTC_TIMESTAMP(3)
              AND u.status = 'ativo'

            LIMIT 1
        `,
        [tokenHash]
    );

    return linhas[0] ?? null;
}


/*
    Atualiza o momento da última utilização
    válida da sessão.
*/
export async function atualizarUltimoUsoSessao(
    sessaoId,
    executor = pool
) {
    await executor.execute(
        `
            UPDATE sessoes
            SET ultimo_uso_em = UTC_TIMESTAMP(3)
            WHERE id = ?
        `,
        [sessaoId]
    );
}


/*
    Revoga uma sessão durante o logout.
*/
export async function revogarSessaoPorTokenHash(
    tokenHash,
    executor = pool
) {
    const [resultado] = await executor.execute(
        `
            UPDATE sessoes
            SET revogada_em = UTC_TIMESTAMP(3)
            WHERE token_hash = ?
              AND revogada_em IS NULL
        `,
        [tokenHash]
    );

    return resultado.affectedRows > 0;
}