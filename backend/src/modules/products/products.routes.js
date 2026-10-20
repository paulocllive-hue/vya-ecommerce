import { Router } from "express";

import {
    listarProdutos
} from "./products.controller.js";


const productsRoutes = Router();


productsRoutes.get("/", listarProdutos);


export default productsRoutes;
