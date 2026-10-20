import { AppError } from "../../errors/app-error.js";

import {
    validarEndereco,
    validarEnderecoId,
    validarFinalizacao,
    validarPedidoId
} from "./checkout.schema.js";

import {
    calcularEntregaUsuario,
    cadastrarEndereco,
    excluirEndereco,
    finalizarPedido,
    integracaoEntregaDisponivel,
    obterEnderecos,
    obterPedido,
    obterPedidos
} from "./checkout.service.js";


function erroValidacao(validacao, mensagem) {
    return new AppError(
        mensagem,
        422,
        "DADOS_INVALIDOS",
        validacao.error.flatten().fieldErrors
    );
}


export async function consultarOpcoesCheckout(
    requisicao,
    resposta
) {
    const usuarioId =
        requisicao.autenticacao.usuario.id;

    const enderecos = await obterEnderecos(
        usuarioId
    );

    return resposta.status(200).json({
        success: true,
        message: "Opções do checkout consultadas.",
        data: {
            retiradaDisponivel: true,
            entregaPropriaDisponivel:
                integracaoEntregaDisponivel(),
            prazoRetirada:
                "Após a confirmação do pedido",
            enderecos
        }
    });
}


export async function listarEnderecos(
    requisicao,
    resposta
) {
    const enderecos = await obterEnderecos(
        requisicao.autenticacao.usuario.id
    );

    return resposta.status(200).json({
        success: true,
        data: {
            enderecos
        }
    });
}


export async function criarEndereco(
    requisicao,
    resposta
) {
    const validacao = validarEndereco(
        requisicao.body
    );

    if (!validacao.success) {
        throw erroValidacao(
            validacao,
            "Os dados do endereço são inválidos."
        );
    }

    const endereco = await cadastrarEndereco(
        requisicao.autenticacao.usuario.id,
        validacao.data
    );

    return resposta.status(201).json({
        success: true,
        message: "Endereço cadastrado com sucesso.",
        data: {
            endereco
        }
    });
}


export async function removerEndereco(
    requisicao,
    resposta
) {
    const validacao = validarEnderecoId(
        requisicao.params
    );

    if (!validacao.success) {
        throw erroValidacao(
            validacao,
            "O identificador do endereço é inválido."
        );
    }

    await excluirEndereco(
        requisicao.autenticacao.usuario.id,
        validacao.data.enderecoId
    );

    return resposta.status(200).json({
        success: true,
        message: "Endereço removido com sucesso."
    });
}


export async function calcularEntrega(
    requisicao,
    resposta
) {
    const validacao = validarEnderecoId(
        requisicao.body
    );

    if (!validacao.success) {
        throw erroValidacao(
            validacao,
            "Escolha um endereço válido para calcular a entrega."
        );
    }

    const entrega = await calcularEntregaUsuario(
        requisicao.autenticacao.usuario.id,
        validacao.data.enderecoId
    );

    return resposta.status(200).json({
        success: true,
        message: "Entrega calculada com sucesso.",
        data: {
            entrega
        }
    });
}


export async function finalizar(
    requisicao,
    resposta
) {
    const validacao = validarFinalizacao(
        requisicao.body
    );

    if (!validacao.success) {
        throw erroValidacao(
            validacao,
            "Os dados do checkout são inválidos."
        );
    }

    const pedido = await finalizarPedido(
        requisicao.autenticacao.usuario,
        validacao.data
    );

    return resposta.status(201).json({
        success: true,
        message: "Pedido criado com sucesso.",
        data: {
            pedido
        }
    });
}


export async function listarPedidos(
    requisicao,
    resposta
) {
    const pedidos = await obterPedidos(
        requisicao.autenticacao.usuario.id
    );

    return resposta.status(200).json({
        success: true,
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

    const pedido = await obterPedido(
        requisicao.autenticacao.usuario.id,
        validacao.data.pedidoId
    );

    return resposta.status(200).json({
        success: true,
        data: {
            pedido
        }
    });
}
