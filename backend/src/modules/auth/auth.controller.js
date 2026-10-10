import {
    criarOpcoesCookieSessao,
    NOME_COOKIE_SESSAO
} from "../../config/session-cookie.js";

import { AppError } from "../../errors/app-error.js";

import {
    criarSessao
} from "../session/session.service.js";

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
    CADASTRO
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
    LOGIN
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

    /*
        Verifica e-mail, senha e status da conta.
    */
    const usuario = await autenticarUsuario(
        validacao.data
    );

    /*
        Somente depois da autenticação bem-sucedida
        criamos a sessão.
    */
    const sessao = await criarSessao(
        usuario.id
    );

    /*
        Envia o token em um cookie HttpOnly.

        O token não será incluído no JSON.
    */
    resposta.cookie(
        NOME_COOKIE_SESSAO,
        sessao.token,
        criarOpcoesCookieSessao(
            sessao.duracaoEmMilissegundos
        )
    );

    return resposta.status(200).json({
        success: true,
        message: "Login realizado com sucesso.",
        data: {
            usuario
        }
    });
}