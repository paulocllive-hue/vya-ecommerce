import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";

import {
    cadastrar,
    entrar,
    entrarComGoogle,
    obterUsuarioAtual,
    sair
} from "./auth.controller.js";


const authRoutes = Router();


/*
    ============================================
    LIMITADOR DO LOGIN
    ============================================
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
        message:
            "Muitas tentativas. Aguarde e tente novamente."
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


/*
    GET /api/auth/me

    Somente usuários com sessão válida
    conseguem acessar.
*/

authRoutes.get(
    "/me",
    exigirAutenticacao,
    obterUsuarioAtual
);


/*
    POST /api/auth/logout

    O logout é idempotente: mesmo que o cookie
    não exista, a resposta continuará sendo
    bem-sucedida.
*/

authRoutes.post(
    "/logout",
    sair
);

/*
    POST /api/auth/google
*/
authRoutes.post(
    "/google",
    limitadorLogin,
    entrarComGoogle
);


export default authRoutes;