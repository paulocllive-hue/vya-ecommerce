import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
    cadastrar,
    entrar
} from "./auth.controller.js";

const authRoutes = Router();


/*
    Limita tentativas de login realizadas
    pelo mesmo endereço IP.
*/
const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,

    message: {
        success: false,
        code: "MUITAS_TENTATIVAS",
        message: "Muitas tentativas. Aguarde e tente novamente."
    }
});


/*
    POST /api/auth/cadastro
*/
authRoutes.post(
    "/cadastro",
    cadastrar
);


/*
    POST /api/auth/login
*/
authRoutes.post(
    "/login",
    limitadorLogin,
    entrar
);


export default authRoutes;