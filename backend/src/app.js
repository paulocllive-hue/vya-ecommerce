import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.js";
import { AppError } from "./errors/app-error.js";
import { tratarErros } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";


const app = express();


/*
    Transforma a lista do .env em um conjunto
    de origens permitidas.

    Exemplo:

    http://127.0.0.1,http://localhost
*/
const origensPermitidas = new Set(
    env.FRONTEND_ORIGINS
        .split(",")
        .map((origem) => origem.trim())
        .filter(Boolean)
);


/*
    Evita anunciar publicamente que o servidor
    utiliza Express.
*/
app.disable("x-powered-by");


/*
    Adiciona cabeçalhos HTTP de segurança.
*/
app.use(helmet());


/*
    ============================================
    CORS
    ============================================

    Controla quais páginas abertas em navegadores
    podem se comunicar com a API.
*/

app.use(
    cors({
        origin(origem, liberarAcesso) {
            /*
                Requisições feitas por ferramentas
                como PowerShell geralmente não
                possuem o cabeçalho Origin.
            */
            if (!origem) {
                liberarAcesso(null, true);
                return;
            }

            /*
                Libera somente origens cadastradas
                na variável FRONTEND_ORIGINS.
            */
            if (origensPermitidas.has(origem)) {
                liberarAcesso(null, true);
                return;
            }

            /*
                Uma página de origem desconhecida
                não receberá autorização CORS.
            */
            liberarAcesso(
                new AppError(
                    "Origem não autorizada.",
                    403,
                    "ORIGEM_NAO_AUTORIZADA"
                )
            );
        },

        /*
            Permite que o navegador envie
            cookies junto das requisições.
        */
        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "X-CSRF-Token"
        ],

        optionsSuccessStatus: 204
    })
);


/*
    Limita o tamanho do JSON recebido.
*/
app.use(
    express.json({
        limit: "10kb",
        strict: true
    })
);


/*
    Converte os cookies recebidos para:

    requisicao.cookies
*/
app.use(cookieParser());


/*
    ============================================
    LIMITADOR GERAL
    ============================================
*/

const limitadorGeral = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        code: "MUITAS_REQUISICOES",
        message:
            "Muitas requisições. Tente novamente mais tarde."
    }
});

app.use("/api", limitadorGeral);


/*
    GET /api/health
*/
app.get(
    "/api/health",
    (requisicao, resposta) => {
        return resposta.status(200).json({
            success: true,
            message: "API VYA funcionando"
        });
    }
);


/*
    Rotas de autenticação.
*/
app.use(
    "/api/auth",
    authRoutes
);


/*
    Esta parte é executada quando nenhuma
    rota anterior foi encontrada.
*/
app.use((requisicao, resposta, proximo) => {
    proximo(
        new AppError(
            "Rota não encontrada.",
            404,
            "ROTA_NAO_ENCONTRADA"
        )
    );
});


/*
    O middleware de erros precisa ser o último.
*/
app.use(tratarErros);


export default app;