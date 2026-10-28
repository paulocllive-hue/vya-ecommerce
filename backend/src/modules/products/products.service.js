import { AppError } from "../../errors/app-error.js";

import {
    listarProdutosPublicos
} from "./products.repository.js";


const CATEGORIAS_PUBLICAS = Object.freeze({
    fitness: "Fitness",
    "moda-praia": "Moda praia",
    natacao: "Natação"
});


function resolverCategoria(categoriaInformada) {
    if (
        categoriaInformada === undefined ||
        categoriaInformada === null ||
        String(categoriaInformada).trim() === ""
    ) {
        return null;
    }

    const identificador = String(categoriaInformada)
        .trim()
        .toLowerCase();

    const categoria = CATEGORIAS_PUBLICAS[
        identificador
    ];

    if (!categoria) {
        throw new AppError(
            "A categoria informada não existe.",
            400,
            "CATEGORIA_INVALIDA"
        );
    }

    return categoria;
}


function montarVariante(linha) {
    return {
        id: linha.variante_id,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        preco: Number(linha.preco),
        estoque: Number(linha.estoque),
        imagemUrl: linha.imagem_url,
        disponivel: Number(linha.estoque) > 0
    };
}


export async function obterProdutosPublicos(
    categoriaInformada
) {
    const categoria = resolverCategoria(
        categoriaInformada
    );

    const linhas = await listarProdutosPublicos(
        categoria
    );

    const produtos = new Map();

    for (const linha of linhas) {
        if (!produtos.has(linha.produto_id)) {
            produtos.set(linha.produto_id, {
                id: linha.produto_id,
                nome: linha.nome,
                categoria: linha.categoria,
                descricao: linha.descricao,
                variantes: []
            });
        }

        produtos
            .get(linha.produto_id)
            .variantes.push(montarVariante(linha));
    }

    return [...produtos.values()];
}