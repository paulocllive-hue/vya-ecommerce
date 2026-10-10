import { AppError } from "../../errors/app-error.js";

import {
    validarCadastro,
    validarLogin
} from "./auth.schema.js";

import {
    autenticarUsuario,
    cadastrarUsuario
} from "./auth.service.js";


/*
    ============================================
    CONTROLLER DE CADASTRO
    ============================================
*/

export async function cadastrar(
    requisicao,
    resposta
) {
    const validacao = validarCadastro(
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

    const {
        nome,
        email,
        senha
    } = validacao.data;

    const usuario = await cadastrarUsuario({
        nome,
        email,
        senha
    });

    return resposta.status(201).json({
        success: true,
        message: "Cadastro realizado com sucesso.",
        data: {
            usuario
        }
    });
}


/*
    ============================================
    CONTROLLER DE LOGIN
    ============================================
*/

export async function entrar(
    requisicao,
    resposta
) {
    const validacao = validarLogin(
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

    const usuario = await autenticarUsuario(
        validacao.data
    );

    return resposta.status(200).json({
        success: true,
        message: "Credenciais válidas.",
        data: {
            usuario
        }
    });
}