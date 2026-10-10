import {
    createHash,
    randomBytes,
    randomUUID
} from "node:crypto";

import { env } from "../../config/env.js";

import {
    atualizarUltimoUsoSessao,
    buscarSessaoValidaPorTokenHash,
    inserirSessao,
    revogarSessaoPorTokenHash
} from "./session.repository.js";


/*
    ============================================
    GERAR HASH DO TOKEN
    ============================================
*/

/*
    Converte o token original em um hash SHA-256.

    O resultado será uma string hexadecimal
    com 64 caracteres.
*/
export function gerarHashToken(token) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}


/*
    ============================================
    CRIAR SESSÃO
    ============================================
*/

export async function criarSessao(usuarioId) {
    /*
        randomBytes(32) gera 32 bytes aleatórios,
        equivalentes a 256 bits.

        base64url transforma esses bytes em texto
        apropriado para transporte em cookie.
    */
    const token = randomBytes(32)
        .toString("base64url");

    /*
        Apenas o hash será armazenado no banco.
    */
    const tokenHash = gerarHashToken(token);

    /*
        Identificador interno da sessão.
    */
    const sessaoId = randomUUID();

    /*
        Converte a duração configurada em dias
        para milissegundos.
    */
    const duracaoEmMilissegundos =
        env.SESSION_TTL_DAYS *
        24 *
        60 *
        60 *
        1000;

    /*
        Define a data absoluta de expiração.
    */
    const expiraEm = new Date(
        Date.now() + duracaoEmMilissegundos
    );

    /*
        Salva somente o hash.
    */
    await inserirSessao({
        id: sessaoId,
        usuarioId,
        tokenHash,
        expiraEm
    });

    /*
        O token original será enviado somente
        para o navegador.

        Ele nunca deverá ser registrado em logs.
    */
    return {
        token,
        expiraEm,
        duracaoEmMilissegundos
    };
}


/*
    ============================================
    VALIDAR SESSÃO
    ============================================
*/

export async function validarSessao(token) {
    /*
        Rejeita valores ausentes ou claramente
        inválidos antes de consultar o banco.
    */
    if (
        typeof token !== "string" ||
        token.length < 32
    ) {
        return null;
    }

    const tokenHash = gerarHashToken(token);

    const sessao =
        await buscarSessaoValidaPorTokenHash(
            tokenHash
        );

    if (!sessao) {
        return null;
    }

    /*
        Registra que a sessão foi utilizada.
    */
    await atualizarUltimoUsoSessao(
        sessao.sessao_id
    );

    /*
        Retorna somente dados internos seguros.
    */
    return {
        sessaoId: sessao.sessao_id,

        usuario: {
            id: sessao.usuario_id,
            nome: sessao.nome,
            email: sessao.email,
            papel: sessao.papel,
            status: sessao.status
        }
    };
}


/*
    ============================================
    REVOGAR SESSÃO
    ============================================
*/

export async function revogarSessao(token) {
    if (
        typeof token !== "string" ||
        token.length < 32
    ) {
        return false;
    }

    const tokenHash = gerarHashToken(token);

    return revogarSessaoPorTokenHash(
        tokenHash
    );
}