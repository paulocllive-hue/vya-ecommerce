import {
    obterProdutosPublicos
} from "./products.service.js";


export async function listarProdutos(
    requisicao,
    resposta
) {
    const produtos = await obterProdutosPublicos();

    return resposta.status(200).json({
        success: true,
        message: "Produtos consultados com sucesso.",
        data: {
            produtos
        }
    });
}
