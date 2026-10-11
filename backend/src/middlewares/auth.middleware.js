import {
    NOME_COOKIE_SESSAO
} from "../config/session-cookie.js";

import { AppError } from "../errors/app-error.js";

import {
    validarSessao
} from "../modules/session/session.service.js";


/*
    ============================================
    EXIGIR AUTENTICAÇÃO
    ============================================

    Este middleware será executado antes de uma
    rota que exige um usuário autenticado.
*/

export async function exigirAutenticacao(
    requisicao,
    resposta,
    proximo
) {
    try {
        /*
            O cookie-parser transforma os cookies
            enviados pelo navegador em um objeto.

            O token será procurado dentro de:

            requisicao.cookies.vya_session
        */
        const token =
            requisicao.cookies?.[
                NOME_COOKIE_SESSAO
            ];

        /*
            Se o cookie não existir, o usuário
            ainda não realizou login.
        */
        if (!token) {
            throw new AppError(
                "É necessário realizar login.",
                401,
                "AUTENTICACAO_NECESSARIA"
            );
        }

        /*
            validarSessao transforma o token em
            hash e procura uma sessão válida
            no banco de dados.
        */
        const sessao = await validarSessao(token);

        /*
            A sessão pode não ser encontrada
            quando:

            - o token foi alterado;
            - a sessão expirou;
            - o logout revogou a sessão;
            - o usuário foi desativado.
        */
        if (!sessao) {
            throw new AppError(
                "Sessão inválida ou expirada.",
                401,
                "SESSAO_INVALIDA"
            );
        }

        /*
            Coloca os dados autenticados dentro
            da requisição.

            Os próximos controllers poderão
            acessar:

            requisicao.autenticacao.usuario
        */
        requisicao.autenticacao = {
            sessaoId: sessao.sessaoId,
            usuario: sessao.usuario
        };

        /*
            Libera a execução da próxima função,
            que normalmente será o controller.
        */
        proximo();
    } catch (erro) {
        /*
            Encaminha qualquer erro para o
            middleware global de erros.
        */
        proximo(erro);
    }
}