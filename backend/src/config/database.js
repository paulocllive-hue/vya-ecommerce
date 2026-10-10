import mysql from "mysql2/promise";

import { env } from "./env.js";

/*
    Cria um conjunto reutilizável de conexões
    com o banco de dados.
*/
export const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,

    /*
        Se todas as conexões estiverem ocupadas,
        uma nova solicitação aguardará.
    */
    waitForConnections: true,

    /*
        Número máximo de conexões simultâneas
        abertas por esta API.
    */
    connectionLimit: 10,

    /*
        Zero significa que não definiremos um
        limite próprio para a fila de espera.
    */
    queueLimit: 0,

    /*
        Ajuda a manter conexões TCP disponíveis.
    */
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/*
    Função utilizada na inicialização da API
    para confirmar que o banco está disponível.
*/
export async function testarConexaoBanco() {
    /*
        Solicita temporariamente uma conexão
        existente no pool.
    */
    const conexao = await pool.getConnection();

    try {
        /*
            Executa uma consulta simples.

            SELECT DATABASE() informa qual banco
            foi selecionado pela conexão.
        */
        const [linhas] = await conexao.execute(`
            SELECT
                DATABASE() AS banco,
                1 AS conectado
        `);

        return linhas[0];
    } finally {
        /*
            Esta parte sempre será executada,
            mesmo se a consulta apresentar erro.

            release() devolve a conexão ao pool.
            Ela não será desperdiçada.
        */
        conexao.release();
    }
}