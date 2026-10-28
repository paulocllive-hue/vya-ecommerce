// timezone: "Z" no mysql2 converte valores no driver, mas não configura
// @@session.time_zone do MariaDB. Inicializamos cada conexão ANTES de usá-la.
export function criarPoolUtc(poolBase) {
    async function getConnection() {
        const conexao = await poolBase.getConnection();
        try {
            await conexao.query("SET SESSION time_zone = '+00:00'");
            return conexao;
        } catch (erro) {
            // Não reutilizar conexão cujo fuso não foi confirmado.
            conexao.destroy();
            throw erro;
        }
    }

    async function executar(metodo, argumentos) {
        const conexao = await getConnection();
        try {
            return await conexao[metodo](...argumentos);
        } finally {
            conexao.release();
        }
    }

    // Interface utilizada atualmente pelos repositórios e serviços da Vya.
    // Transações continuam usando a mesma conexão até commit/rollback/release.
    return Object.freeze({
        getConnection,
        query: (...args) => executar("query", args),
        execute: (...args) => executar("execute", args),
        end: () => poolBase.end()
    });
}
