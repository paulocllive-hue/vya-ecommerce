import { AppError } from "../../errors/app-error.js";

import {
    validarAtualizacaoProduto,
    validarAtualizacaoVariante,
    validarConsultaProximoSku,
    validarCriacaoProduto,
    validarCriacaoVariante,
    validarProdutoId,
    validarVarianteId
} from "./admin-products.schema.js";

import {
    criarProduto,
    criarVariante,
    editarProduto,
    editarVariante,
    obterCategoriasProduto,
    obterProximoSku,
    obterProdutosAdmin,
    removerProduto
} from "./admin-products.service.js";


function exigirValidacao(validacao, mensagem) {
    if (!validacao.success) {
        throw new AppError(
            mensagem,
            422,
            "DADOS_INVALIDOS",
            validacao.error.flatten().fieldErrors
        );
    }

    return validacao.data;
}


export async function listarProdutos(
    requisicao,
    resposta
) {
    const produtos = await obterProdutosAdmin();

    return resposta.status(200).json({
        success: true,
        message: "Produtos administrativos consultados.",
        data: {
            produtos,
            categorias: obterCategoriasProduto()
        }
    });
}


export async function consultarProximoSku(
    requisicao,
    resposta
) {
    const consulta = exigirValidacao(
        validarConsultaProximoSku(requisicao.query),
        "Selecione uma categoria válida para gerar o SKU."
    );

    const sku = await obterProximoSku(
        consulta.categoria
    );

    return resposta.status(200).json({
        success: true,
        message: "Próximo SKU calculado com sucesso.",
        data: { sku }
    });
}


export async function cadastrarProduto(
    requisicao,
    resposta
) {
    const dados = exigirValidacao(
        validarCriacaoProduto(requisicao.body),
        "Os dados do produto são inválidos."
    );

    const produto = await criarProduto(dados);

    return resposta.status(201).json({
        success: true,
        message: "Produto cadastrado com sucesso.",
        data: { produto }
    });
}


export async function atualizarProduto(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarProdutoId(requisicao.params),
        "O identificador do produto é inválido."
    );

    const dados = exigirValidacao(
        validarAtualizacaoProduto(requisicao.body),
        "Os dados do produto são inválidos."
    );

    const produto = await editarProduto(
        parametros.produtoId,
        dados
    );

    return resposta.status(200).json({
        success: true,
        message: "Produto atualizado com sucesso.",
        data: { produto }
    });
}


export async function excluirProduto(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarProdutoId(requisicao.params),
        "O identificador do produto é inválido."
    );

    const produto = await removerProduto(
        parametros.produtoId
    );

    return resposta.status(200).json({
        success: true,
        message: "Produto excluído definitivamente.",
        data: { produto }
    });
}


export async function cadastrarVariante(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarProdutoId(requisicao.params),
        "O identificador do produto é inválido."
    );

    const dados = exigirValidacao(
        validarCriacaoVariante(requisicao.body),
        "Os dados da variante são inválidos."
    );

    const variante = await criarVariante(
        parametros.produtoId,
        dados
    );

    return resposta.status(201).json({
        success: true,
        message: "Variante cadastrada com sucesso.",
        data: { variante }
    });
}


export async function atualizarVariante(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarVarianteId(requisicao.params),
        "Os identificadores informados são inválidos."
    );

    const dados = exigirValidacao(
        validarAtualizacaoVariante(requisicao.body),
        "Os dados da variante são inválidos."
    );

    const variante = await editarVariante(
        parametros.produtoId,
        parametros.varianteId,
        dados
    );

    return resposta.status(200).json({
        success: true,
        message: "Variante atualizada com sucesso.",
        data: { variante }
    });
}
