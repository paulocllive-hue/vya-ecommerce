import { randomUUID } from "node:crypto";

import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    gerarHashSenha,
    verificarSenha
} from "../../services/password.service.js";

import {
    buscarCredencialPorEmail,
    buscarUsuarioPorEmail,
    inserirCredencialLocal,
    inserirUsuario
} from "./auth.repository.js";


/*
    Este hash fictício é criado quando o módulo
    de autenticação é carregado.

    Ele será utilizado quando o e-mail informado
    não existir ou não possuir uma senha local.
*/
const hashFicticioPromise = gerarHashSenha(
    "Senha ficticia usada somente internamente"
);


/*
    ============================================
    CADASTRAR USUÁRIO COM E-MAIL E SENHA
    ============================================
*/

export async function cadastrarUsuario({
    nome,
    email,
    senha
}) {
    /*
        Verifica antecipadamente se o e-mail
        já está cadastrado.
    */
    const usuarioExistente =
        await buscarUsuarioPorEmail(email);

    if (usuarioExistente) {
        throw new AppError(
            "Este e-mail já está cadastrado.",
            409,
            "EMAIL_JA_CADASTRADO"
        );
    }

    /*
        Gera um identificador UUID para o usuário.
    */
    const usuarioId = randomUUID();

    /*
        Transforma a senha original em hash.

        Somente o hash será enviado ao banco.
    */
    const senhaHash = await gerarHashSenha(
        senha
    );

    /*
        Reserva uma conexão do pool.

        Essa mesma conexão será utilizada durante
        toda a transação.
    */
    const conexao = await pool.getConnection();

    try {
        /*
            Inicia a transação.
        */
        await conexao.beginTransaction();

        /*
            Insere os dados principais do usuário.
        */
        await inserirUsuario(
            conexao,
            {
                id: usuarioId,
                nome,
                email
            }
        );

        /*
            Insere o hash da senha.
        */
        await inserirCredencialLocal(
            conexao,
            {
                usuarioId,
                senhaHash
            }
        );

        /*
            Confirma as duas inserções.
        */
        await conexao.commit();

        /*
            Retorna somente os dados públicos.

            A senha e o hash nunca são retornados.
        */
        return {
            id: usuarioId,
            nome,
            email,
            papel: "cliente",
            status: "ativo"
        };
    } catch (erro) {
        /*
            Se alguma operação falhar, desfaz
            todas as alterações da transação.
        */
        await conexao.rollback();

        /*
            O índice UNIQUE do banco também
            impede e-mails duplicados.

            Essa verificação protege contra duas
            requisições simultâneas.
        */
        if (erro.code === "ER_DUP_ENTRY") {
            throw new AppError(
                "Este e-mail já está cadastrado.",
                409,
                "EMAIL_JA_CADASTRADO"
            );
        }

        /*
            Erros desconhecidos serão encaminhados
            ao middleware centralizado.
        */
        throw erro;
    } finally {
        /*
            Devolve a conexão ao pool, mesmo
            quando ocorrer algum erro.
        */
        conexao.release();
    }
}


/*
    ============================================
    AUTENTICAR USUÁRIO COM E-MAIL E SENHA
    ============================================
*/

export async function autenticarUsuario({
    email,
    senha
}) {
    /*
        Busca a conta e a credencial local
        associadas ao e-mail.
    */
    const credencial =
        await buscarCredencialPorEmail(email);

    /*
        Se a conta não existir ou não possuir
        senha local, utiliza o hash fictício.

        Isso mantém um custo de processamento
        semelhante e dificulta descobrir quais
        e-mails estão cadastrados pelo tempo
        da resposta.
    */
    const senhaHash =
        credencial?.senha_hash ??
        await hashFicticioPromise;

    /*
        Compara a senha informada com o hash.

        A função retorna true ou false.
    */
    const senhaCorreta = await verificarSenha(
        senhaHash,
        senha
    );

    /*
        A resposta é propositalmente genérica.

        Não informamos se o erro está no e-mail
        ou na senha.
    */
    if (
        !credencial ||
        !credencial.senha_hash ||
        !senhaCorreta
    ) {
        throw new AppError(
            "E-mail ou senha inválidos.",
            401,
            "CREDENCIAIS_INVALIDAS"
        );
    }

    /*
        Mesmo com a senha correta, somente contas
        ativas podem entrar.
    */
    if (credencial.status !== "ativo") {
        throw new AppError(
            "Não foi possível acessar esta conta.",
            403,
            "CONTA_INDISPONIVEL"
        );
    }

    /*
        Retorna somente informações públicas.
    */
    return {
        id: credencial.id,
        nome: credencial.nome,
        email: credencial.email,
        papel: credencial.papel,
        status: credencial.status
    };
}