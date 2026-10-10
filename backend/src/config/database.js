import mysql from "mysql2/promise";

import { env } from "./env.js";


/*
    Cria um pool reutilizável de conexões
    com o MariaDB.
*/
export const pool = mysql.createPool({
    /*
        Dados validados pelo env.js.
    */
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,

    /*
        Faz o mysql2 tratar as datas em UTC.

        Isso evita divergências quando o servidor
        for publicado em outro fuso horário.
    */
    timezone: "Z",

    /*
        Aguarda uma conexão ficar disponível
        quando todas estiverem ocupadas.
    */
    waitForConnections: true,

    /*
        Máximo de conexões simultâneas abertas
        por esta instância da API.
    */
    connectionLimit: 10,

    /*
        Zero significa que não definiremos
        um limite adicional para a fila.
    */
    queueLimit: 0,

    /*
        Mantém a conexão TCP ativa.
    */
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});


/*
    Confirma se a API consegue se comunicar
    com o banco configurado.
*/
export async function testarConexaoBanco() {
    const conexao = await pool.getConnection();

    try {
        const [linhas] = await conexao.execute(
            `
                SELECT
                    DATABASE() AS banco,
                    1 AS conectado
            `
        );

        return linhas[0];
    } finally {
        /*
            Devolve a conexão ao pool, inclusive
            se a consulta apresentar erro.
        */
        conexao.release();
    }
}