import { env } from "./env.js";


/*
    Em produção usamos o prefixo __Host-.

    Esse prefixo exige:
    - HTTPS;
    - atributo Secure;
    - Path=/;
    - ausência do atributo Domain.
*/
export const NOME_COOKIE_SESSAO =
    env.NODE_ENV === "production"
        ? "__Host-vya_session"
        : "vya_session";


/*
    Configuração utilizada ao criar o cookie.
*/
export function criarOpcoesCookieSessao(
    duracaoEmMilissegundos
) {
    return {
        /*
            Impede que JavaScript do navegador
            leia o token.
        */
        httpOnly: true,

        /*
            Em produção o cookie só poderá
            trafegar por HTTPS.
        */
        secure:
            env.NODE_ENV === "production",

        /*
            Reduz o envio do cookie em navegações
            iniciadas por outros sites.
        */
        sameSite: "lax",

        /*
            Cookie válido para toda a API.
        */
        path: "/",

        /*
            Duração do cookie no navegador.
        */
        maxAge: duracaoEmMilissegundos
    };
}


/*
    Configuração utilizada para apagar o cookie.

    Os atributos precisam corresponder aos
    utilizados durante sua criação.
*/
export function criarOpcoesRemocaoCookie() {
    return {
        httpOnly: true,

        secure:
            env.NODE_ENV === "production",

        sameSite: "lax",

        path: "/"
    };
}