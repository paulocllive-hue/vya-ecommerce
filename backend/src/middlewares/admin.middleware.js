import { AppError } from "../errors/app-error.js";


/*
    Este middleware deve ser utilizado depois de
    exigirAutenticacao. A autorização é conferida
    no backend, mesmo que o frontend esconda o link.
*/
export function exigirAdministrador(
    requisicao,
    resposta,
    proximo
) {
    const papel =
        requisicao.autenticacao?.usuario?.papel;

    if (papel !== "administrador") {
        proximo(
            new AppError(
                "Esta área é exclusiva para administradores.",
                403,
                "ACESSO_ADMINISTRATIVO_NECESSARIO"
            )
        );

        return;
    }

    proximo();
}
