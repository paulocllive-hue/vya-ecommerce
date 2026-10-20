import { Router } from "express";

import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";

import {
    calcularEntrega,
    consultarOpcoesCheckout,
    consultarPedido,
    criarEndereco,
    finalizar,
    listarEnderecos,
    listarPedidos,
    removerEndereco
} from "./checkout.controller.js";


const checkoutRoutes = Router();


checkoutRoutes.use(
    exigirAutenticacao
);


checkoutRoutes.get(
    "/",
    consultarOpcoesCheckout
);


checkoutRoutes.get(
    "/enderecos",
    listarEnderecos
);


checkoutRoutes.post(
    "/enderecos",
    criarEndereco
);


checkoutRoutes.delete(
    "/enderecos/:enderecoId",
    removerEndereco
);


checkoutRoutes.post(
    "/calcular-entrega",
    calcularEntrega
);


checkoutRoutes.post(
    "/finalizar",
    finalizar
);


checkoutRoutes.get(
    "/pedidos",
    listarPedidos
);


checkoutRoutes.get(
    "/pedidos/:pedidoId",
    consultarPedido
);


export default checkoutRoutes;
