import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

/*
    Descobre o caminho da pasta onde este arquivo está.
*/
const caminhoArquivo = fileURLToPath(import.meta.url);
const pastaAtual = path.dirname(caminhoArquivo);

/*
    Localiza o arquivo backend/.env.

    env.js está em:
    backend/src/config/env.js

    "../../.env" volta duas pastas:
    config → src → backend
*/
const caminhoEnv = path.resolve(
    pastaAtual,
    "../../.env"
);

/*
    Carrega as variáveis do .env para process.env.
*/
dotenv.config({
    path: caminhoEnv,
    quiet: true
});

/*
    Define quais configurações o backend exige
    e qual formato cada uma deve possuir.
*/
const esquemaAmbiente = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    HOST: z
        .string()
        .min(1)
        .default("127.0.0.1"),

    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3000),

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
        .min(12)
});

/*
    Verifica as variáveis carregadas.
*/
const resultado = esquemaAmbiente.safeParse(
    process.env
);

/*
    Se alguma configuração estiver ausente
    ou inválida, o backend será interrompido.
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

    Object.freeze impede alterações acidentais
    durante a execução do backend.
*/
export const env = Object.freeze(
    resultado.data
);