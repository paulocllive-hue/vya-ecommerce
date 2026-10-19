import { AppError } from "../../errors/app-error.js";

import {
    validarAdicaoItem,
    validarAtualizacaoQuantidade,
    validarItemId
} from "./cart.schema.js";

import {
    adicionarItemAoCarrinho,
    alterarQuantidadeItem,
    esvaziarCarrinho,
    obterCarrinho,
    removerItemDoCarrinho
} from "./cart.service.js";


/*
    ============================================
    CONSULTAR CARRINHO
    ============================================
*/

export async function consultarCarrinho(
    requisicao,
    resposta
) {
    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const carrinho =
        await obterCarrinho(usuarioId);

    return resposta.status(200).json({
        success: true,
        message:
            "Carrinho consultado com sucesso.",
        data: {
            carrinho
        }
    });
}


/*
    ============================================
    ADICIONAR ITEM
    ============================================
*/

export async function adicionarItem(
    requisicao,
    resposta
) {
    const validacao =
        validarAdicaoItem(
            requisicao.body
        );

    if (!validacao.success) {
        throw new AppError(
            "Os dados enviados são inválidos.",
            422,
            "DADOS_INVALIDOS",
            validacao.error.flatten().fieldErrors
        );
    }

    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const carrinho =
        await adicionarItemAoCarrinho(
            usuarioId,
            validacao.data
        );

    return resposta.status(201).json({
        success: true,
        message:
            "Produto adicionado ao carrinho.",
        data: {
            carrinho
        }
    });
}


/*
    ============================================
    ATUALIZAR QUANTIDADE
    ============================================
*/

export async function atualizarQuantidade(
    requisicao,
    resposta
) {
    const validacaoParametros =
        validarItemId(
            requisicao.params
        );

    if (!validacaoParametros.success) {
        throw new AppError(
            "O identificador do item é inválido.",
            422,
            "PARAMETROS_INVALIDOS",
            validacaoParametros.error
                .flatten()
                .fieldErrors
        );
    }

    const validacaoCorpo =
        validarAtualizacaoQuantidade(
            requisicao.body
        );

    if (!validacaoCorpo.success) {
        throw new AppError(
            "Os dados enviados são inválidos.",
            422,
            "DADOS_INVALIDOS",
            validacaoCorpo.error
                .flatten()
                .fieldErrors
        );
    }

    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const carrinho =
        await alterarQuantidadeItem(
            usuarioId,
            validacaoParametros.data.itemId,
            validacaoCorpo.data.quantidade
        );

    return resposta.status(200).json({
        success: true,
        message:
            "Quantidade atualizada com sucesso.",
        data: {
            carrinho
        }
    });
}


/*
    ============================================
    REMOVER ITEM
    ============================================
*/

export async function removerItem(
    requisicao,
    resposta
) {
    const validacao =
        validarItemId(
            requisicao.params
        );

    if (!validacao.success) {
        throw new AppError(
            "O identificador do item é inválido.",
            422,
            "PARAMETROS_INVALIDOS",
            validacao.error.flatten().fieldErrors
        );
    }

    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const carrinho =
        await removerItemDoCarrinho(
            usuarioId,
            validacao.data.itemId
        );

    return resposta.status(200).json({
        success: true,
        message:
            "Item removido do carrinho.",
        data: {
            carrinho
        }
    });
}


/*
    ============================================
    ESVAZIAR CARRINHO
    ============================================
*/

export async function limparCarrinho(
    requisicao,
    resposta
) {
    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const carrinho =
        await esvaziarCarrinho(
            usuarioId
        );

    return resposta.status(200).json({
        success: true,
        message:
            "Carrinho esvaziado com sucesso.",
        data: {
            carrinho
        }
    });
}