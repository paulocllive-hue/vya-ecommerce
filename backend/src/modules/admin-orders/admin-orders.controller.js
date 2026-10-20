import { AppError } from "../../errors/app-error.js";

import {
    validarAtualizacaoPedido,
    validarPedidoId
} from "./admin-orders.schema.js";

import {
    executarAcaoPedido,
    obterPedidoAdmin,
    obterPedidosAdmin
} from "./admin-orders.service.js";


function erroValidacao(validacao, mensagem) {
    return new AppError(
        mensagem,
        422,
        "DADOS_INVALIDOS",
        validacao.error.flatten().fieldErrors
    );
}


export async function listarPedidos(
    requisicao,
    resposta
) {
    const pedidos = await obterPedidosAdmin();

    return resposta.status(200).json({
        success: true,
        message: "Pedidos administrativos consultados.",
        data: {
            pedidos
        }
    });
}


export async function consultarPedido(
    requisicao,
    resposta
) {
    const validacao = validarPedidoId(
        requisicao.params
    );

    if (!validacao.success) {
        throw erroValidacao(
            validacao,
            "O identificador do pedido é inválido."
        );
    }

    const pedido = await obterPedidoAdmin(
        validacao.data.pedidoId
    );

    return resposta.status(200).json({
        success: true,
        data: {
            pedido
        }
    });
}


export async function atualizarPedido(
    requisicao,
    resposta
) {
    const validacaoId = validarPedidoId(
        requisicao.params
    );

    if (!validacaoId.success) {
        throw erroValidacao(
            validacaoId,
            "O identificador do pedido é inválido."
        );
    }

    const validacaoCorpo =
        validarAtualizacaoPedido(
            requisicao.body
        );

    if (!validacaoCorpo.success) {
        throw erroValidacao(
            validacaoCorpo,
            "A ação enviada é inválida."
        );
    }

    const pedido = await executarAcaoPedido(
        validacaoId.data.pedidoId,
        validacaoCorpo.data.acao
    );

    return resposta.status(200).json({
        success: true,
        message: "Pedido atualizado com sucesso.",
        data: {
            pedido
        }
    });
}
