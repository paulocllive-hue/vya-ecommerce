import { pool } from "../../config/database.js";


/*
    ============================================
    INSERIR SESSÃO
    ============================================
*/

/*
    Insere uma nova sessão no banco.

    O token original não chega ao repository.
    Somente seu hash é armazenado.
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
    ============================================
    BUSCAR SESSÃO VÁLIDA
    ============================================
*/

/*
    Busca uma sessão utilizando o hash do token.

    Ela somente será retornada se:
    - não estiver revogada;
    - não estiver expirada;
    - o usuário estiver ativo.
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
    ============================================
    ATUALIZAR ÚLTIMO USO
    ============================================
*/

/*
    Registra o momento da última utilização
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
    ============================================
    REVOGAR SESSÃO
    ============================================
*/

/*
    Invalida uma sessão, por exemplo durante
    o logout do usuário.
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

    /*
        Retorna true quando alguma sessão
        foi realmente revogada.
    */
    return resultado.affectedRows > 0;
}