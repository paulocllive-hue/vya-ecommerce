import { Router } from "express";

import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";

import {
    exigirAdministrador
} from "../../middlewares/admin.middleware.js";

import {
    atualizarPedido,
    consultarPedido,
    listarPedidos
} from "./admin-orders.controller.js";


const adminOrdersRoutes = Router();


adminOrdersRoutes.use(
    exigirAutenticacao,
    exigirAdministrador
);


adminOrdersRoutes.get(
    "/",
    listarPedidos
);


adminOrdersRoutes.get(
    "/:pedidoId",
    consultarPedido
);


adminOrdersRoutes.patch(
    "/:pedidoId",
    atualizarPedido
);


export default adminOrdersRoutes;
