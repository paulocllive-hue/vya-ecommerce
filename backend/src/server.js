import app from "./app.js";

import {
    pool,
    testarConexaoBanco
} from "./config/database.js";

import { env } from "./config/env.js";

/*
    Inicializa todos os recursos necessários
    para o funcionamento da API.
*/
async function iniciarServidor() {
    try {
        /*
            Antes de abrir a API, confirma se
            o MariaDB está disponível.
        */
        const banco = await testarConexaoBanco();

        console.log(
            `Banco conectado: ${banco.banco}`
        );

        /*
            Abre o servidor HTTP somente depois
            que o banco responder corretamente.
        */
        const servidor = app.listen(
            env.PORT,
            env.HOST,
            () => {
                console.log(
                    `API VYA rodando em http://${env.HOST}:${env.PORT}`
                );
            }
        );

        /*
            Encerra o servidor e as conexões
            corretamente quando pressionamos Ctrl+C.
        */
        async function encerrarServidor(sinal) {
            console.log(
                `\n${sinal} recebido. Encerrando servidor...`
            );

            servidor.close(async () => {
                /*
                    Fecha todas as conexões abertas
                    pelo pool do mysql2.
                */
                await pool.end();

                console.log(
                    "Servidor e banco encerrados."
                );

                process.exit(0);
            });
        }

        process.once("SIGINT", () => {
            encerrarServidor("SIGINT");
        });

        process.once("SIGTERM", () => {
            encerrarServidor("SIGTERM");
        });
    } catch (erro) {
        /*
            Se o banco não responder, a API
            não ficará funcionando parcialmente.
        */
        console.error(
            "Não foi possível iniciar a API:",
            erro.message
        );

        await pool.end();

        process.exit(1);
    }
}

iniciarServidor();