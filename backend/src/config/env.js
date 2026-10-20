import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";


/*
    Descobre o endereço completo deste arquivo.
*/
const caminhoArquivo = fileURLToPath(
    import.meta.url
);


/*
    Descobre a pasta onde env.js está localizado.
*/
const pastaAtual = path.dirname(
    caminhoArquivo
);


/*
    Localiza o arquivo backend/.env.

    env.js está localizado em:
    backend/src/config/env.js

    "../../.env" volta:
    config → src → backend
*/
const caminhoEnv = path.resolve(
    pastaAtual,
    "../../.env"
);


/*
    Carrega as variáveis do arquivo .env
    para process.env.
*/
dotenv.config({
    path: caminhoEnv,
    quiet: true
});


/*
    Define e valida todas as configurações
    necessárias para o backend.
*/
const esquemaAmbiente = z.object({
    /*
        Ambiente atual da aplicação.
    */
    NODE_ENV: z
        .enum([
            "development",
            "test",
            "production"
        ])
        .default("development"),

    /*
        Endereço em que a API ficará disponível.
    */
    HOST: z
        .string()
        .min(1)
        .default("127.0.0.1"),

    /*
        Porta HTTP da API.
    */
    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3000),

    FRONTEND_ORIGINS: z
        .string()
        .min(1)
        .default(
            "http://127.0.0.1,http://localhost"
        ),
    
        

    /*
        Configurações do MariaDB.
    */
    DB_HOST: z
        .string()
        .min(1),

    DB_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3306),

    DB_NAME: z
        .string()
        .min(1),

    DB_USER: z
        .string()
        .min(1),

    DB_PASSWORD: z
        .string()
        .min(12),

    /*
        Quantidade de dias que uma sessão
        poderá permanecer válida.
    */
    SESSION_TTL_DAYS: z.coerce
        .number()
        .int()
        .min(1)
        .max(30)
        .default(7),

    GOOGLE_CLIENT_ID: z
        .string()
        .trim()
        .min(20)
        .endsWith(".apps.googleusercontent.com"),

    /*
        Integração futura com a Google Routes API.

        As duas variáveis são opcionais para que
        o backend continue funcionando enquanto
        a integração de distância não for ativada.
    */
    GOOGLE_MAPS_API_KEY: z
        .string()
        .trim()
        .min(20)
        .optional(),

    ENTREGA_ENDERECO_ORIGEM: z
        .string()
        .trim()
        .min(10)
        .optional()
});


/*
    Valida as variáveis carregadas do .env.
*/
const resultado = esquemaAmbiente.safeParse(
    process.env
);


/*
    Se alguma configuração estiver ausente
    ou inválida, o backend será encerrado.
*/
if (!resultado.success) {
    console.error(
        "Configurações inválidas:",
        resultado.error.flatten().fieldErrors
    );

    process.exit(1);
}


/*
    Exporta somente as configurações validadas.

    Object.freeze impede que essas configurações
    sejam alteradas acidentalmente durante
    a execução da aplicação.
*/
export const env = Object.freeze(
    resultado.data
);
