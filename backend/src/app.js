import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    express.json({
        limit: "10kb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "10kb"
    })
);

const limitadorApi = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Muitas requisições. Tente novamente mais tarde."
    }
});

app.use("/api", limitadorApi);

app.get("/api/health", (request, response) => {
    response.status(200).json({
        success: true,
        message: "API VYA funcionando"
    });
});

app.use((request, response) => {
    response.status(404).json({
        success: false,
        message: "Rota não encontrada"
    });
});

app.use((error, request, response, next) => {
    console.error(error);

    response.status(500).json({
        success: false,
        message: "Erro interno do servidor"
    });
});

export default app;