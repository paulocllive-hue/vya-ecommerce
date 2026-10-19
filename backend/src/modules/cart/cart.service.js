import { randomUUID } from "node:crypto";

import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    atualizarQuantidadeItem,
    buscarCarrinhoPorUsuario,
    buscarItemDoUsuario,
    buscarItemPorVariante,
    buscarVarianteParaAtualizacao,
    criarCarrinhoSeNaoExistir,
    esvaziarCarrinhoDoUsuario,
    inserirItemCarrinho,
    listarItensCarrinho,
    marcarCarrinhoAtualizado,
    removerItemDoUsuario
} from "./cart.repository.js";


/*
    ============================================
    OBTER OU CRIAR CARRINHO
    ============================================
*/

async function obterOuCriarCarrinho(
    usuarioId,
    executor = pool
) {
    await criarCarrinhoSeNaoExistir(
        {
            id: randomUUID(),
            usuarioId
        },
        executor
    );

    const carrinho =
        await buscarCarrinhoPorUsuario(
            usuarioId,
            executor
        );

    if (!carrinho) {
        throw new AppError(
            "Não foi possível criar o carrinho.",
            500,
            "ERRO_AO_CRIAR_CARRINHO"
        );
    }

    return carrinho;
}


/*
    ============================================
    MONTAR RESPOSTA DO CARRINHO
    ============================================
*/

function montarRespostaCarrinho(
    carrinho,
    linhas
) {
    let quantidadeTotal = 0;
    let totalCentavos = 0;

    const itens = linhas.map((linha) => {
        const quantidade =
            Number(linha.quantidade);

        const precoCentavos = Math.round(
            Number(linha.preco) * 100
        );

        const subtotalCentavos =
            precoCentavos * quantidade;

        const estoque =
            Number(linha.estoque);

        const produtoAtivo =
            Boolean(
                Number(linha.produto_ativo)
            );

        const varianteAtiva =
            Boolean(
                Number(linha.variante_ativa)
            );

        const disponivel =
            produtoAtivo &&
            varianteAtiva &&
            estoque >= quantidade;

        quantidadeTotal += quantidade;
        totalCentavos += subtotalCentavos;

        return {
            id: linha.item_id,

            produtoId:
                linha.produto_id,

            produtoVarianteId:
                linha.produto_variante_id,

            nome: linha.nome,
            categoria: linha.categoria,
            sku: linha.sku,
            tamanho: linha.tamanho,
            cor: linha.cor,

            preco:
                precoCentavos / 100,

            quantidade,

            subtotal:
                subtotalCentavos / 100,

            estoque,

            imagemUrl:
                linha.imagem_url,

            disponivel
        };
    });

    return {
        id: carrinho.id,
        itens,
        quantidadeTotal,
        total: totalCentavos / 100
    };
}


/*
    ============================================
    CONSULTAR CARRINHO
    ============================================
*/

export async function obterCarrinho(
    usuarioId
) {
    const carrinho =
        await obterOuCriarCarrinho(
            usuarioId
        );

    const linhas =
        await listarItensCarrinho(
            usuarioId
        );

    return montarRespostaCarrinho(
        carrinho,
        linhas
    );
}


/*
    ============================================
    ADICIONAR ITEM
    ============================================
*/

export async function adicionarItemAoCarrinho(
    usuarioId,
    {
        produtoVarianteId,
        quantidade
    }
) {
    const conexao =
        await pool.getConnection();

    try {
        await conexao.beginTransaction();

        /*
            Bloqueia a variante durante esta
            alteração para evitar inconsistência
            de estoque entre requisições.
        */
        const variante =
            await buscarVarianteParaAtualizacao(
                produtoVarianteId,
                conexao
            );

        if (!variante) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        if (
            !Number(variante.produto_ativo) ||
            !Number(variante.variante_ativa)
        ) {
            throw new AppError(
                "Este produto não está disponível.",
                409,
                "PRODUTO_INDISPONIVEL"
            );
        }

        const carrinho =
            await obterOuCriarCarrinho(
                usuarioId,
                conexao
            );

        const itemExistente =
            await buscarItemPorVariante(
                carrinho.id,
                produtoVarianteId,
                conexao
            );

        const quantidadeAtual =
            Number(
                itemExistente?.quantidade ?? 0
            );

        const novaQuantidade =
            quantidadeAtual + quantidade;

        if (novaQuantidade > 99) {
            throw new AppError(
                "A quantidade máxima por produto é 99.",
                422,
                "QUANTIDADE_MAXIMA_EXCEDIDA"
            );
        }

        if (
            novaQuantidade >
            Number(variante.estoque)
        ) {
            throw new AppError(
                "A quantidade solicitada não está disponível em estoque.",
                409,
                "ESTOQUE_INSUFICIENTE"
            );
        }

        if (itemExistente) {
            await atualizarQuantidadeItem(
                itemExistente.id,
                novaQuantidade,
                conexao
            );
        } else {
            await inserirItemCarrinho(
                {
                    id: randomUUID(),
                    carrinhoId:
                        carrinho.id,
                    produtoVarianteId,
                    quantidade
                },
                conexao
            );
        }

        await marcarCarrinhoAtualizado(
            carrinho.id,
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    return obterCarrinho(usuarioId);
}


/*
    ============================================
    ALTERAR QUANTIDADE
    ============================================
*/

export async function alterarQuantidadeItem(
    usuarioId,
    itemId,
    quantidade
) {
    const conexao =
        await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const item =
            await buscarItemDoUsuario(
                itemId,
                usuarioId,
                conexao
            );

        if (!item) {
            throw new AppError(
                "Item do carrinho não encontrado.",
                404,
                "ITEM_NAO_ENCONTRADO"
            );
        }

        if (
            !Number(item.produto_ativo) ||
            !Number(item.variante_ativa)
        ) {
            throw new AppError(
                "Este produto não está disponível.",
                409,
                "PRODUTO_INDISPONIVEL"
            );
        }

        if (
            quantidade >
            Number(item.estoque)
        ) {
            throw new AppError(
                "A quantidade solicitada não está disponível em estoque.",
                409,
                "ESTOQUE_INSUFICIENTE"
            );
        }

        await atualizarQuantidadeItem(
            item.id,
            quantidade,
            conexao
        );

        await marcarCarrinhoAtualizado(
            item.carrinho_id,
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    return obterCarrinho(usuarioId);
}


/*
    ============================================
    REMOVER ITEM
    ============================================
*/

export async function removerItemDoCarrinho(
    usuarioId,
    itemId
) {
    const conexao =
        await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const item =
            await buscarItemDoUsuario(
                itemId,
                usuarioId,
                conexao
            );

        if (!item) {
            throw new AppError(
                "Item do carrinho não encontrado.",
                404,
                "ITEM_NAO_ENCONTRADO"
            );
        }

        await removerItemDoUsuario(
            itemId,
            usuarioId,
            conexao
        );

        await marcarCarrinhoAtualizado(
            item.carrinho_id,
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    return obterCarrinho(usuarioId);
}


/*
    ============================================
    ESVAZIAR CARRINHO
    ============================================
*/

export async function esvaziarCarrinho(
    usuarioId
) {
    const carrinho =
        await obterOuCriarCarrinho(
            usuarioId
        );

    await esvaziarCarrinhoDoUsuario(
        usuarioId
    );

    await marcarCarrinhoAtualizado(
        carrinho.id
    );

    return obterCarrinho(usuarioId);
}