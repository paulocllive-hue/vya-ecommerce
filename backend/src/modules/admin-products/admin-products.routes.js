import { Router } from "express";

import {
    exigirAdministrador
} from "../../middlewares/admin.middleware.js";
import {
    exigirAutenticacao
} from "../../middlewares/auth.middleware.js";
import {
    receberImagemProduto
} from "../../middlewares/product-image-upload.middleware.js";

import {
    atualizarProduto,
    atualizarVariante,
    cadastrarProduto,
    cadastrarVariante,
    consultarProximoSku,
    excluirProduto,
    listarProdutos
} from "./admin-products.controller.js";


const adminProductsRoutes = Router();


adminProductsRoutes.use(
    exigirAutenticacao,
    exigirAdministrador
);

adminProductsRoutes.get("/", listarProdutos);
adminProductsRoutes.get(
    "/proximo-sku",
    consultarProximoSku
);
adminProductsRoutes.post(
    "/",
    receberImagemProduto,
    cadastrarProduto
);
adminProductsRoutes.patch("/:produtoId", atualizarProduto);
adminProductsRoutes.delete("/:produtoId", excluirProduto);
adminProductsRoutes.post(
    "/:produtoId/variantes",
    receberImagemProduto,
    cadastrarVariante
);
adminProductsRoutes.patch(
    "/:produtoId/variantes/:varianteId",
    receberImagemProduto,
    atualizarVariante
);


export default adminProductsRoutes;
