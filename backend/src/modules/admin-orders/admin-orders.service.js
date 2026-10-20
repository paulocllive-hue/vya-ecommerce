import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    atualizarSituacaoPedido,
    buscarPedidoAdmin,
    devolverEstoque,
    listarItensPedidoAdmin,
    listarPedidosAdmin
} from "./admin-orders.repository.js";


const PEDIDOS_FINAIS = new Set([
    "concluido",
    "cancelado"
]);


function montarItem(linha) {
    return {
        id: linha.id,
        produtoId: linha.produto_id,
        produtoVarianteId:
            linha.produto_variante_id,
        nome: linha.nome_produto,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        precoUnitario:
            Number(linha.preco_unitario),
        quantidade: Number(linha.quantidade),
        subtotal: Number(linha.subtotal)
    };
}


function obterAcoesDisponiveis(linha) {
    const acoes = [];

    if (PEDIDOS_FINAIS.has(linha.status)) {
        return acoes;
    }

    if (linha.status_pagamento === "pendente") {
        acoes.push("confirmar_pagamento");
    }

    if (
        linha.status_pagamento === "aprovado" &&
        [
            "aguardando_pagamento",
            "pago"
        ].includes(linha.status)
    ) {
        acoes.push("iniciar_preparacao");
    }

    if (linha.status === "em_preparacao") {
        acoes.push("marcar_pronto");
    }

    if (
        linha.metodo_entrega === "entrega_propria" &&
        linha.status === "pronto_para_envio"
    ) {
        acoes.push("iniciar_entrega");
    }

    if (
        (
            linha.metodo_entrega === "retirada" &&
            linha.status === "pronto_para_retirada"
        ) ||
        (
            linha.metodo_entrega === "entrega_propria" &&
            linha.status === "em_transporte"
        )
    ) {
        acoes.push("concluir");
    }

    acoes.push("cancelar");

    return acoes;
}


function montarPedido(linha, itens = undefined) {
    const pedido = {
        id: linha.id,
        numeroPedido: Number(linha.numero_pedido),
        status: linha.status,
        statusPagamento:
            linha.status_pagamento,
        metodoPagamento:
            linha.metodo_pagamento,
        metodoEntrega: linha.metodo_entrega,
        statusEntrega: linha.status_entrega,
        subtotal: Number(linha.subtotal),
        valorFrete: Number(linha.valor_frete),
        desconto: Number(linha.desconto),
        total: Number(linha.total),
        quantidadeItens:
            Number(linha.quantidade_itens ?? 0),
        distanciaEntregaKm:
            linha.distancia_entrega_km === null
                ? null
                : Number(linha.distancia_entrega_km),
        prazoEntregaDiasUteis:
            linha.prazo_entrega_dias_uteis === null
                ? null
                : Number(
                    linha.prazo_entrega_dias_uteis
                ),
        dataPrevistaEntrega:
            linha.data_prevista_entrega,
        entregueEm: linha.entregue_em,
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em,
        cliente: {
            id: linha.usuario_id,
            nome: linha.cliente_nome,
            email: linha.cliente_email
        },
        endereco: linha.metodo_entrega ===
            "entrega_propria"
            ? {
                destinatario:
                    linha.destinatario,
                cep: linha.cep,
                logradouro: linha.logradouro,
                numero: linha.numero_endereco,
                complemento: linha.complemento,
                bairro: linha.bairro,
                cidade: linha.cidade,
                estado: linha.estado
            }
            : null,
        acoesDisponiveis:
            obterAcoesDisponiveis(linha)
    };

    if (itens) {
        pedido.itens = itens.map(montarItem);
        pedido.quantidadeItens = itens.reduce(
            (total, item) => {
                return total + Number(item.quantidade);
            },
            0
        );
    }

    return pedido;
}


function exigirCondicao(
    condicao,
    mensagem,
    codigo = "TRANSICAO_PEDIDO_INVALIDA"
) {
    if (!condicao) {
        throw new AppError(
            mensagem,
            409,
            codigo
        );
    }
}


export async function obterPedidosAdmin() {
    const linhas = await listarPedidosAdmin();
    return linhas.map((linha) => montarPedido(linha));
}


export async function obterPedidoAdmin(pedidoId) {
    const pedido = await buscarPedidoAdmin(pedidoId);

    if (!pedido) {
        throw new AppError(
            "Pedido não encontrado.",
            404,
            "PEDIDO_NAO_ENCONTRADO"
        );
    }

    const itens = await listarItensPedidoAdmin(
        pedidoId
    );

    return montarPedido(pedido, itens);
}


export async function executarAcaoPedido(
    pedidoId,
    acao
) {
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const pedido = await buscarPedidoAdmin(
            pedidoId,
            conexao,
            true
        );

        if (!pedido) {
            throw new AppError(
                "Pedido não encontrado.",
                404,
                "PEDIDO_NAO_ENCONTRADO"
            );
        }

        let status = pedido.status;
        let statusPagamento =
            pedido.status_pagamento;
        let statusEntrega =
            pedido.status_entrega;
        let entregueEm = pedido.entregue_em;

        if (acao === "confirmar_pagamento") {
            exigirCondicao(
                !PEDIDOS_FINAIS.has(status) &&
                statusPagamento === "pendente",
                "O pagamento deste pedido não pode mais ser confirmado."
            );

            statusPagamento = "aprovado";
            status = "pago";
        }

        if (acao === "iniciar_preparacao") {
            exigirCondicao(
                statusPagamento === "aprovado" &&
                [
                    "aguardando_pagamento",
                    "pago"
                ].includes(status),
                "Confirme o pagamento antes de iniciar a preparação."
            );

            status = "em_preparacao";
        }

        if (acao === "marcar_pronto") {
            exigirCondicao(
                status === "em_preparacao",
                "O pedido precisa estar em preparação."
            );

            if (pedido.metodo_entrega === "retirada") {
                status = "pronto_para_retirada";
                statusEntrega =
                    "pronto_para_retirada";
            } else {
                status = "pronto_para_envio";
                statusEntrega = "aguardando_envio";
            }
        }

        if (acao === "iniciar_entrega") {
            exigirCondicao(
                pedido.metodo_entrega ===
                    "entrega_propria" &&
                status === "pronto_para_envio",
                "Este pedido ainda não está pronto para sair para entrega."
            );

            status = "em_transporte";
            statusEntrega = "em_transporte";
        }

        if (acao === "concluir") {
            const retiradaPronta =
                pedido.metodo_entrega === "retirada" &&
                status === "pronto_para_retirada";

            const entregaEmTransporte =
                pedido.metodo_entrega ===
                    "entrega_propria" &&
                status === "em_transporte";

            exigirCondicao(
                retiradaPronta || entregaEmTransporte,
                "O pedido ainda não está pronto para ser concluído."
            );

            status = "concluido";
            statusEntrega = "entregue";
            entregueEm = new Date();
        }

        if (acao === "cancelar") {
            exigirCondicao(
                !PEDIDOS_FINAIS.has(status),
                "Este pedido não pode mais ser cancelado."
            );

            const itens =
                await listarItensPedidoAdmin(
                    pedidoId,
                    conexao,
                    true
                );

            for (const item of itens) {
                await devolverEstoque(
                    item.produto_variante_id,
                    Number(item.quantidade),
                    conexao
                );
            }

            status = "cancelado";
            statusEntrega = "cancelada";
        }

        await atualizarSituacaoPedido(
            {
                pedidoId,
                status,
                statusPagamento,
                statusEntrega,
                entregueEm
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

    return obterPedidoAdmin(pedidoId);
}
