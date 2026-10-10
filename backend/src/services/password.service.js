import argon2 from "argon2";

/*
    Configuração do algoritmo Argon2id.

    memoryCost é medido em KiB:
    19456 KiB equivalem a aproximadamente 19 MiB.
*/
const configuracaoArgon2 = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32
};

/*
    Recebe a senha original e devolve um hash.

    A senha original nunca deve ser salva.
*/
export async function gerarHashSenha(senha) {
    return argon2.hash(
        senha,
        configuracaoArgon2
    );
}

/*
    Compara uma senha informada com o hash
    armazenado no banco de dados.
*/
export async function verificarSenha(
    senhaHash,
    senhaInformada
) {
    return argon2.verify(
        senhaHash,
        senhaInformada
    );
}

/*
    Verifica se um hash antigo precisa ser
    atualizado após mudarmos as configurações.
*/
export function hashPrecisaAtualizar(senhaHash) {
    return argon2.needsRehash(
        senhaHash,
        configuracaoArgon2
    );
}