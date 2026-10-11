import {
    criarOpcoesCookieSessao,
    criarOpcoesRemocaoCookie,
    NOME_COOKIE_SESSAO
} from "../../config/session-cookie.js";

import { AppError } from "../../errors/app-error.js";

import {
    criarSessao,
    revogarSessao
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
        Confere o e-mail, o hash da senha
        e o status da conta.
    */
    const usuario = await autenticarUsuario(
        validacao.data
    );

    /*
        Cria a sessão somente depois que as
        credenciais forem validadas.
    */
    const sessao = await criarSessao(
        usuario.id
    );

    /*
        Envia o token no cookie HttpOnly.
        O token não aparece na resposta JSON.
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


/*
    ============================================
    USUÁRIO AUTENTICADO
    ============================================
*/

export function obterUsuarioAtual(
    requisicao,
    resposta
) {
    return resposta.status(200).json({
        success: true,
        message: "Usuário autenticado.",
        data: {
            usuario:
                requisicao.autenticacao.usuario
        }
    });
}


/*
    ============================================
    LOGOUT
    ============================================
*/

export async function sair(
    requisicao,
    resposta
) {
    /*
        Recupera o token enviado pelo navegador.
    */
    const token =
        requisicao.cookies?.[
            NOME_COOKIE_SESSAO
        ];

    /*
        Se existir um token, seu hash será
        localizado no banco e a sessão será
        marcada como revogada.

        O token original não é armazenado.
    */
    if (token) {
        await revogarSessao(token);
    }

    /*
        Remove o cookie do navegador.

        Para removê-lo, path, secure e sameSite
        precisam ser iguais aos usados quando
        ele foi criado.
    */
    resposta.clearCookie(
        NOME_COOKIE_SESSAO,
        criarOpcoesRemocaoCookie()
    );

    return resposta.status(200).json({
        success: true,
        message: "Logout realizado com sucesso."
    });
}