import { Router } from "express";

import {
    exigirAdministrador
} from "../../middlewares/admin.middleware.js";
import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";

import {
    atualizarProduto,
    atualizarVariante,
    cadastrarProduto,
    cadastrarVariante,
    listarProdutos
} from "./admin-products.controller.js";


const adminProductsRoutes = Router();


adminProductsRoutes.use(
    exigirAutenticacao,
    exigirAdministrador
);

adminProductsRoutes.get("/", listarProdutos);
adminProductsRoutes.post("/", cadastrarProduto);
adminProductsRoutes.patch("/:produtoId", atualizarProduto);
adminProductsRoutes.post(
    "/:produtoId/variantes",
    cadastrarVariante
);
adminProductsRoutes.patch(
    "/:produtoId/variantes/:varianteId",
    atualizarVariante
);


export default adminProductsRoutes;
