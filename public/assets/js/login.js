/*
    Endereço do backend durante o desenvolvimento.

    Usamos 127.0.0.1 tanto no site quanto na API
    para evitar problemas com cookies.
*/
const URL_API =
    "http://127.0.0.1:3000/api";


const formulario =
    document.querySelector("#formulario-login");

const mensagem =
    document.querySelector("#mensagem-login");

const botao =
    document.querySelector("#botao-login");


/*
    Exibe mensagens usando textContent.

    Não usamos innerHTML porque mensagens recebidas
    externamente não devem ser interpretadas como HTML.
*/
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.dataset.tipo = tipo;
}


/*
    Executada quando o formulário for enviado.
*/
formulario.addEventListener(
    "submit",
    async (evento) => {
        evento.preventDefault();

        /*
            Impede vários cliques enquanto a
            requisição está sendo processada.
        */
        botao.disabled = true;
        botao.textContent = "Entrando...";

        mostrarMensagem("", "");

        const dadosFormulario =
            new FormData(formulario);

        const dadosLogin = {
            email: String(
                dadosFormulario.get("email")
            ).trim(),

            senha: String(
                dadosFormulario.get("senha")
            )
        };

        try {
            const resposta = await fetch(
                `${URL_API}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    /*
                        Permite receber e enviar o
                        cookie HttpOnly da sessão.
                    */
                    credentials: "include",

                    body: JSON.stringify(dadosLogin)
                }
            );

            const resultado =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.message ??
                    "Não foi possível realizar o login."
                );
            }

            mostrarMensagem(
                "Login realizado com sucesso.",
                "sucesso"
            );

            /*
                Após o login, encaminha o cliente
                para o carrinho.
            */
            setTimeout(() => {
                window.location.href =
                    "./carrinho.html";
            }, 800);
        } catch (erro) {
            /*
                Uma mensagem controlada é exibida
                sem mostrar detalhes internos.
            */
            mostrarMensagem(
                erro.message === "Failed to fetch"
                    ? "Não foi possível conectar ao servidor."
                    : erro.message,
                "erro"
            );
        } finally {
            botao.disabled = false;
            botao.textContent = "Entrar";
        }
    }
);