import { randomUUID } from "node:crypto";

import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";
import { gerarHashSenha } from "../../services/password.service.js";

import {
    buscarUsuarioPorEmail,
    inserirCredencialLocal,
    inserirUsuario
} from "./auth.repository.js";

/*
    Realiza todo o processo de cadastro.
*/
export async function cadastrarUsuario({
    nome,
    email,
    senha
}) {
    /*
        Esta primeira consulta evita gastar recursos
        gerando um hash quando o e-mail já existe.
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
        O UUID será o identificador público
        e interno deste usuário.
    */
    const usuarioId = randomUUID();

    /*
        A senha original existe apenas na memória
        durante esta requisição.

        O banco receberá somente o hash.
    */
    const senhaHash = await gerarHashSenha(senha);

    /*
        Reserva uma conexão para executar todas
        as operações da transação.
    */
    const conexao = await pool.getConnection();

    try {
        /*
            A partir daqui, os comandos só serão
            confirmados após o commit.
        */
        await conexao.beginTransaction();

        await inserirUsuario(
            conexao,
            {
                id: usuarioId,
                nome,
                email
            }
        );

        await inserirCredencialLocal(
            conexao,
            {
                usuarioId,
                senhaHash
            }
        );

        /*
            Confirma definitivamente as inserções.
        */
        await conexao.commit();

        /*
            Nunca devolvemos senha ou senha_hash.
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
            Desfaz todas as operações realizadas
            desde beginTransaction().
        */
        await conexao.rollback();

        /*
            Mesmo após a primeira consulta, duas
            requisições simultâneas poderiam tentar
            cadastrar o mesmo e-mail.

            O índice UNIQUE do banco é a proteção
            definitiva para esse caso.
        */
        if (erro.code === "ER_DUP_ENTRY") {
            throw new AppError(
                "Este e-mail já está cadastrado.",
                409,
                "EMAIL_JA_CADASTRADO"
            );
        }

        throw erro;
    } finally {
        /*
            Devolve a conexão ao pool em qualquer
            resultado: sucesso ou erro.
        */
        conexao.release();
    }
}