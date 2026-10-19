import { Router } from "express";

import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";

import {
    adicionarItem,
    atualizarQuantidade,
    consultarCarrinho,
    limparCarrinho,
    removerItem
} from "./cart.controller.js";


const cartRoutes = Router();


/*
    Todas as rotas abaixo exigem
    um usuário autenticado.
*/
cartRoutes.use(
    exigirAutenticacao
);


/*
    GET /api/carrinho
*/
cartRoutes.get(
    "/",
    consultarCarrinho
);


/*
    POST /api/carrinho/itens
*/
cartRoutes.post(
    "/itens",
    adicionarItem
);


/*
    PATCH /api/carrinho/itens/:itemId
*/
cartRoutes.patch(
    "/itens/:itemId",
    atualizarQuantidade
);


/*
    DELETE /api/carrinho/itens/:itemId
*/
cartRoutes.delete(
    "/itens/:itemId",
    removerItem
);


/*
    DELETE /api/carrinho
*/
cartRoutes.delete(
    "/",
    limparCarrinho
);


export default cartRoutes;