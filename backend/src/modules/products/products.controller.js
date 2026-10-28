import {
    obterProdutosPublicos
} from "./products.service.js";


export async function listarProdutos(
    requisicao,
    resposta
) {
    const categoria = requisicao.query.categoria;

    const produtos = await obterProdutosPublicos(
        categoria
    );

    return resposta.status(200).json({
        success: true,
        message: "Produtos consultados com sucesso.",
        data: {
            produtos
        }
    });
}