import { OAuth2Client } from "google-auth-library";

import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";


/*
    Cria o cliente responsável por conversar
    com os serviços de autenticação do Google.

    O Client ID identifica o aplicativo VYA.
*/
const clienteGoogle = new OAuth2Client(
    env.GOOGLE_CLIENT_ID
);


/*
    Valida a credencial recebida do navegador.

    A credencial será criada pelo Google depois
    que o usuário selecionar sua conta.
*/
export async function validarCredencialGoogle(
    credencial
) {
    /*
        Evita enviar valores ausentes ou claramente
        inválidos para a biblioteca do Google.
    */
    if (
        typeof credencial !== "string" ||
        credencial.length < 100
    ) {
        throw new AppError(
            "Credencial do Google inválida.",
            401,
            "CREDENCIAL_GOOGLE_INVALIDA"
        );
    }

    try {
        /*
            verifyIdToken realiza as verificações:

            - assinatura digital;
            - emissor Google;
            - data de expiração;
            - Client ID de destino;
            - integridade da credencial.
        */
        const ticket = await clienteGoogle.verifyIdToken({
            idToken: credencial,
            audience: env.GOOGLE_CLIENT_ID
        });

        /*
            getPayload retorna os dados confirmados
            depois da validação criptográfica.
        */
        const payload = ticket.getPayload();

        /*
            sub é o identificador permanente da
            conta dentro do Google.
        */
        if (
            !payload ||
            typeof payload.sub !== "string" ||
            payload.sub.length === 0
        ) {
            throw new AppError(
                "A conta Google não possui um identificador válido.",
                401,
                "CONTA_GOOGLE_INVALIDA"
            );
        }

        /*
            O e-mail é necessário para criar a conta
            correspondente dentro da VYA.
        */
        if (
            typeof payload.email !== "string" ||
            payload.email.length === 0
        ) {
            throw new AppError(
                "O Google não forneceu um endereço de e-mail.",
                401,
                "EMAIL_GOOGLE_INDISPONIVEL"
            );
        }

        /*
            Aceitamos somente e-mails que o Google
            informa como verificados.
        */
        if (payload.email_verified !== true) {
            throw new AppError(
                "O endereço de e-mail do Google não está verificado.",
                401,
                "EMAIL_GOOGLE_NAO_VERIFICADO"
            );
        }

        const email = payload.email
            .trim()
            .toLowerCase();

        /*
            Algumas contas podem não fornecer nome.

            Nesse caso usamos um nome neutro, que
            posteriormente poderá ser alterado
            pelo usuário em seu perfil.
        */
        const nome =
            typeof payload.name === "string" &&
            payload.name.trim().length > 0
                ? payload.name.trim().slice(0, 120)
                : "Cliente VYA";

        /*
            Não retornamos nem armazenamos o token.

            Retornamos somente os dados estritamente
            necessários para localizar ou cadastrar
            o usuário.
        */
        return {
            provedor: "google",
            provedorUsuarioId: payload.sub,
            email,
            nome
        };
    } catch (erro) {
        /*
            Mantém os erros controlados criados
            acima com seus códigos específicos.
        */
        if (erro instanceof AppError) {
            throw erro;
        }

        /*
            Não devolvemos detalhes internos da
            biblioteca ou do token ao navegador.
        */
        throw new AppError(
            "Não foi possível validar a conta Google.",
            401,
            "CREDENCIAL_GOOGLE_INVALIDA"
        );
    }
}