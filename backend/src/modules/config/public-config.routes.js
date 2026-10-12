import { Router } from "express";

import { env } from "../../config/env.js";


const publicConfigRoutes = Router();


/*
    GET /api/config/public

    Entrega somente configurações que podem
    ser utilizadas pelo frontend público.

    Senhas, segredos e configurações do banco
    nunca devem aparecer nesta resposta.
*/
publicConfigRoutes.get(
    "/public",
    (requisicao, resposta) => {
        return resposta.status(200).json({
            success: true,

            data: {
                googleClientId:
                    env.GOOGLE_CLIENT_ID
            }
        });
    }
);


export default publicConfigRoutes;