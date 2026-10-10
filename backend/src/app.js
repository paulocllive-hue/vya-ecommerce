import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { AppError } from "./errors/app-error.js";
import { tratarErros } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

/*
    Evita anunciar publicamente que usamos Express.
*/
app.disable("x-powered-by");

/*
    Adiciona cabeçalhos HTTP de segurança.
*/
app.use(helmet());

/*
    Limita o tamanho do JSON recebido.

    Isso evita que alguém envie arquivos enormes
    tentando consumir a memória do servidor.
*/
app.use(
    express.json({
        limit: "10kb",
        strict: true
    })
);

app.use(cookieParser());

/*
    Limite geral de requisições por endereço IP.
*/
const limitadorGeral = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        code: "MUITAS_REQUISICOES",
        message: "Muitas requisições. Tente novamente mais tarde."
    }
});

app.use("/api", limitadorGeral);

/*
    Rota de verificação da API.
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
    Esta parte somente será executada quando
    nenhuma rota anterior corresponder.
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