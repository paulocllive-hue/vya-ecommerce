import { Router } from "express";
import { excluirTeste } from "./admin-order-delete.controller.js";

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


adminOrdersRoutes.delete("/:pedidoId", excluirTeste);

export default adminOrdersRoutes;
