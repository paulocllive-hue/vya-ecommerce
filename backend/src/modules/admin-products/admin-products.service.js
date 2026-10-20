import { randomUUID } from "node:crypto";

import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    atualizarProduto,
    atualizarVariante,
    buscarProdutoAdmin,
    buscarVarianteAdmin,
    inserirProduto,
    inserirVariante,
    listarProdutosAdmin,
    listarVariantesAdmin
} from "./admin-products.repository.js";


function montarVariante(linha) {
    return {
        id: linha.id,
        produtoId: linha.produto_id,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        preco: Number(linha.preco),
        estoque: Number(linha.estoque),
        imagemUrl: linha.imagem_url,
        ativo: Boolean(Number(linha.ativo)),
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em
    };
}


function montarProduto(linha, variantes = []) {
    const variantesMontadas = variantes.map(
        montarVariante
    );

    return {
        id: linha.id,
        nome: linha.nome,
        categoria: linha.categoria,
        descricao: linha.descricao,
        ativo: Boolean(Number(linha.ativo)),
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em,
        estoqueTotal: variantesMontadas.reduce(
            (total, variante) => {
                return total + variante.estoque;
            },
            0
        ),
        variantes: variantesMontadas
    };
}


function tratarDuplicidade(erro) {
    if (erro.code === "ER_DUP_ENTRY") {
        throw new AppError(
            "Já existe uma variante com este SKU ou com a mesma combinação de tamanho e cor.",
            409,
            "VARIANTE_DUPLICADA"
        );
    }

    throw erro;
}


export async function obterProdutosAdmin() {
    const [produtos, variantes] = await Promise.all([
        listarProdutosAdmin(),
        listarVariantesAdmin()
    ]);

    const variantesPorProduto = new Map();

    for (const variante of variantes) {
        const lista = variantesPorProduto.get(
            variante.produto_id
        ) ?? [];

        lista.push(variante);
        variantesPorProduto.set(
            variante.produto_id,
            lista
        );
    }

    return produtos.map((produto) => {
        return montarProduto(
            produto,
            variantesPorProduto.get(produto.id) ?? []
        );
    });
}


export async function criarProduto(dados) {
    const conexao = await pool.getConnection();
    const produtoId = randomUUID();

    try {
        await conexao.beginTransaction();

        await inserirProduto(
            {
                id: produtoId,
                nome: dados.nome,
                categoria: dados.categoria,
                descricao: dados.descricao,
                ativo: dados.ativo
            },
            conexao
        );

        await inserirVariante(
            {
                id: randomUUID(),
                produtoId,
                ...dados.varianteInicial
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    const produtos = await obterProdutosAdmin();
    return produtos.find(
        (produto) => produto.id === produtoId
    );
}


export async function editarProduto(
    produtoId,
    dados
) {
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const atual = await buscarProdutoAdmin(
            produtoId,
            conexao,
            true
        );

        if (!atual) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        await atualizarProduto(
            {
                id: produtoId,
                nome: dados.nome ?? atual.nome,
                categoria:
                    dados.categoria ?? atual.categoria,
                descricao:
                    dados.descricao !== undefined
                        ? dados.descricao
                        : atual.descricao,
                ativo:
                    dados.ativo !== undefined
                        ? dados.ativo
                        : Boolean(Number(atual.ativo))
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    const produtos = await obterProdutosAdmin();
    return produtos.find(
        (produto) => produto.id === produtoId
    );
}


export async function criarVariante(
    produtoId,
    dados
) {
    const conexao = await pool.getConnection();
    const varianteId = randomUUID();

    try {
        await conexao.beginTransaction();

        const produto = await buscarProdutoAdmin(
            produtoId,
            conexao,
            true
        );

        if (!produto) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        await inserirVariante(
            {
                id: varianteId,
                produtoId,
                ...dados
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    return montarVariante(
        await buscarVarianteAdmin(
            produtoId,
            varianteId
        )
    );
}


export async function editarVariante(
    produtoId,
    varianteId,
    dados
) {
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const atual = await buscarVarianteAdmin(
            produtoId,
            varianteId,
            conexao,
            true
        );

        if (!atual) {
            throw new AppError(
                "Variante não encontrada.",
                404,
                "VARIANTE_NAO_ENCONTRADA"
            );
        }

        await atualizarVariante(
            {
                id: varianteId,
                produtoId,
                sku: dados.sku ?? atual.sku,
                tamanho:
                    dados.tamanho ?? atual.tamanho,
                cor: dados.cor ?? atual.cor,
                preco:
                    dados.preco ?? Number(atual.preco),
                estoque:
                    dados.estoque ?? Number(atual.estoque),
                imagemUrl:
                    dados.imagemUrl !== undefined
                        ? dados.imagemUrl
                        : atual.imagem_url,
                ativo:
                    dados.ativo !== undefined
                        ? dados.ativo
                        : Boolean(Number(atual.ativo))
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    return montarVariante(
        await buscarVarianteAdmin(
            produtoId,
            varianteId
        )
    );
}
