(() => {
    "use strict";

    const URL_API =
    "http://localhost:3000/api";

    const CHAVE_CONVITE_EXIBIDO =
        "vya_convite_login_exibido";

    let usuarioAtual = null;
    let focoAnterior = null;


    /*
        Cria o HTML do modal dinamicamente.

        Como o conteúdo abaixo é fixo e controlado
        pelo próprio projeto, podemos usar
        insertAdjacentHTML.
    */
    function criarModal() {
        document.body.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="auth-modal"
                    id="auth-modal"
                    aria-hidden="true"
                    hidden
                >
                    <div
                        class="auth-modal__fundo"
                        data-fechar-auth
                    ></div>

                    <section
                        class="auth-modal__janela"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-modal-titulo"
                        tabindex="-1"
                    >
                        <button
                            class="auth-modal__fechar"
                            type="button"
                            aria-label="Fechar"
                            data-fechar-auth
                        >
                            &times;
                        </button>

                        <div id="auth-area-visitante">
                            <header class="auth-modal__cabecalho">
                                <span class="destaque">
                                    Minha conta
                                </span>

                                <h2 id="auth-modal-titulo">
                                    Bem-vindo à VYA
                                </h2>

                                <p>
                                    Entre ou crie sua conta para
                                    acompanhar suas compras.
                                </p>
                            </header>

                            <div
                                class="auth-modal__abas"
                                role="tablist"
                                aria-label="Autenticação"
                            >
                                <button
                                    class="auth-modal__aba"
                                    id="aba-login"
                                    type="button"
                                    role="tab"
                                    aria-selected="true"
                                    aria-controls="painel-login"
                                    data-auth-aba="login"
                                >
                                    Entrar
                                </button>

                                <button
                                    class="auth-modal__aba"
                                    id="aba-cadastro"
                                    type="button"
                                    role="tab"
                                    aria-selected="false"
                                    aria-controls="painel-cadastro"
                                    data-auth-aba="cadastro"
                                >
                                    Criar conta
                                </button>
                            </div>

                            <div
                                id="painel-login"
                                role="tabpanel"
                                aria-labelledby="aba-login"
                            >
                                <form
                                    class="auth-formulario"
                                    id="auth-formulario-login"
                                >
                                    <div class="auth-formulario__campo">
                                        <label for="auth-login-email">
                                            E-mail
                                        </label>

                                        <input
                                            id="auth-login-email"
                                            name="email"
                                            type="email"
                                            autocomplete="email"
                                            maxlength="254"
                                            required
                                        >
                                    </div>

                                    <div class="auth-formulario__campo">
                                        <label for="auth-login-senha">
                                            Senha
                                        </label>

                                        <input
                                            id="auth-login-senha"
                                            name="senha"
                                            type="password"
                                            autocomplete="current-password"
                                            required
                                        >
                                    </div>

                                    <p
                                        class="auth-formulario__mensagem"
                                        id="auth-mensagem-login"
                                        role="alert"
                                        aria-live="polite"
                                    ></p>

                                    <button
                                        class="botao"
                                        id="auth-botao-login"
                                        type="submit"
                                    >
                                        Entrar
                                    </button>
                                </form>
                            </div>

                            <div
                                id="painel-cadastro"
                                role="tabpanel"
                                aria-labelledby="aba-cadastro"
                                hidden
                            >
                                <form
                                    class="auth-formulario"
                                    id="auth-formulario-cadastro"
                                >
                                    <div class="auth-formulario__campo">
                                        <label for="auth-cadastro-nome">
                                            Nome
                                        </label>

                                        <input
                                            id="auth-cadastro-nome"
                                            name="nome"
                                            type="text"
                                            autocomplete="name"
                                            minlength="2"
                                            maxlength="120"
                                            required
                                        >
                                    </div>

                                    <div class="auth-formulario__campo">
                                        <label for="auth-cadastro-email">
                                            E-mail
                                        </label>

                                        <input
                                            id="auth-cadastro-email"
                                            name="email"
                                            type="email"
                                            autocomplete="email"
                                            maxlength="254"
                                            required
                                        >
                                    </div>

                                    <div class="auth-formulario__campo">
                                        <label for="auth-cadastro-senha">
                                            Senha
                                        </label>

                                        <input
                                            id="auth-cadastro-senha"
                                            name="senha"
                                            type="password"
                                            autocomplete="new-password"
                                            minlength="12"
                                            maxlength="128"
                                            required
                                        >
                                    </div>

                                    <div class="auth-formulario__campo">
                                        <label for="auth-confirmar-senha">
                                            Confirmar senha
                                        </label>

                                        <input
                                            id="auth-confirmar-senha"
                                            name="confirmacaoSenha"
                                            type="password"
                                            autocomplete="new-password"
                                            minlength="12"
                                            maxlength="128"
                                            required
                                        >
                                    </div>

                                    <p
                                        class="auth-formulario__mensagem"
                                        id="auth-mensagem-cadastro"
                                        role="alert"
                                        aria-live="polite"
                                    ></p>

                                    <button
                                        class="botao"
                                        id="auth-botao-cadastro"
                                        type="submit"
                                    >
                                        Criar conta
                                    </button>
                                </form>
                            </div>

                                <div class="auth-modal__oauth">
                                    <div class="auth-modal__divisor">
                                        <span>ou continue com</span>
                                    </div>

                                    <div
                                        class="auth-modal__google-botao"
                                        id="auth-google-botao"
                                    ></div>

                                    <p
                                        class="auth-formulario__mensagem"
                                        id="auth-mensagem-google"
                                        role="alert"
                                        aria-live="polite"
                                    ></p>
                                </div>

                                </div>

                        <div
                            class="auth-modal__usuario"
                            id="auth-area-logada"
                            hidden
                        >
                            <span class="destaque">
                                Minha conta
                            </span>

                            <h2 id="auth-usuario-nome"></h2>

                            <p
                                class="auth-modal__usuario-email"
                                id="auth-usuario-email"
                            ></p>

                            <a
                                class="botao"
                                href="pages/pedidos.html"
                                id="auth-link-pedidos"
                            >
                                Meus pedidos
                            </a>

                            <a
                                class="botao"
                                href="pages/carrinho.html"
                                id="auth-link-carrinho"
                            >
                                Ir para o carrinho
                            </a>

                            <button
                                class="botao"
                                id="auth-botao-logout"
                                type="button"
                            >
                                Sair da conta
                            </button>

                            <p
                                class="auth-formulario__mensagem"
                                id="auth-mensagem-logout"
                                role="alert"
                                aria-live="polite"
                            ></p>
                        </div>
                    </section>
                </div>
            `
        );
    }


    /*
        Comunicação centralizada com o backend.
    */
    async function chamarApi(
        caminho,
        opcoes = {}
    ) {
        const cabecalhos = {
            ...(opcoes.body
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}),
            ...(opcoes.headers ?? {})
        };

        const resposta = await fetch(
            `${URL_API}${caminho}`,
            {
                ...opcoes,
                credentials: "include",
                headers: cabecalhos
            }
        );

        let resultado = null;

        try {
            resultado = await resposta.json();
        } catch {
            resultado = null;
        }

        if (!resposta.ok) {
            const erro = new Error(
                resultado?.message ??
                "Não foi possível completar a operação."
            );

            erro.status = resposta.status;
            erro.codigo = resultado?.code;

            throw erro;
        }

        return resultado;
    }


    function mostrarMensagem(
        elemento,
        texto,
        tipo = ""
    ) {
        elemento.textContent = texto;
        elemento.dataset.tipo = tipo;
    }


    function obterBotaoConta() {
        let botao =
            document.querySelector("#botao-conta");

        if (botao) {
            return botao;
        }

        const cabecalho =
            document.querySelector(
                ".cabecalho-conteudo"
            );

        if (!cabecalho) {
            return null;
        }

        botao = document.createElement("a");
        botao.id = "botao-conta";
        botao.className = "conta-link";
        botao.textContent = "Entrar / Cadastrar";

        const dentroDePages =
            window.location.pathname.includes(
                "/pages/"
            );

        botao.href = dentroDePages
            ? "login.html"
            : "pages/login.html";

        const carrinho =
            cabecalho.querySelector(
                ".carrinho-link"
            );

        cabecalho.insertBefore(
            botao,
            carrinho
        );

        return botao;
    }


    criarModal();

    const modal =
        document.querySelector("#auth-modal");

    const janela =
        modal.querySelector(
            ".auth-modal__janela"
        );

    const areaVisitante =
        document.querySelector(
            "#auth-area-visitante"
        );

    const areaLogada =
        document.querySelector(
            "#auth-area-logada"
        );

    const formularioLogin =
        document.querySelector(
            "#auth-formulario-login"
        );

    const formularioCadastro =
        document.querySelector(
            "#auth-formulario-cadastro"
        );

    const mensagemLogin =
        document.querySelector(
            "#auth-mensagem-login"
        );

    const mensagemCadastro =
        document.querySelector(
            "#auth-mensagem-cadastro"
        );

    const mensagemLogout =
        document.querySelector(
            "#auth-mensagem-logout"
        );

    const botaoLogin =
        document.querySelector(
            "#auth-botao-login"
        );

    const botaoCadastro =
        document.querySelector(
            "#auth-botao-cadastro"
        );

    const botaoLogout =
        document.querySelector(
            "#auth-botao-logout"
        );

    const botaoConta = obterBotaoConta();

    const areaBotaoGoogle =
    document.querySelector(
        "#auth-google-botao"
    );

    const mensagemGoogle =
    document.querySelector(
        "#auth-mensagem-google"
    );

    /*
    ============================================
    LOGIN COM GOOGLE
    ============================================
*/


/*
    Carrega a biblioteca oficial do Google
    diretamente dos servidores do Google.
*/
function carregarBibliotecaGoogle() {
    return new Promise(
        (resolver, rejeitar) => {
            /*
                Se já foi carregada anteriormente,
                não precisamos carregar novamente.
            */
            if (
                window.google?.accounts?.id
            ) {
                resolver();
                return;
            }

            /*
                Impede a criação de dois scripts
                iguais na mesma página.
            */
            const scriptExistente =
                document.querySelector(
                    "script[data-google-identity]"
                );

            if (scriptExistente) {
                scriptExistente.addEventListener(
                    "load",
                    resolver,
                    {
                        once: true
                    }
                );

                scriptExistente.addEventListener(
                    "error",
                    () => {
                        rejeitar(
                            new Error(
                                "Não foi possível carregar o login Google."
                            )
                        );
                    },
                    {
                        once: true
                    }
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src =
                "https://accounts.google.com/gsi/client";

            script.async = true;
            script.defer = true;

            script.dataset.googleIdentity =
                "true";

            script.addEventListener(
                "load",
                resolver,
                {
                    once: true
                }
            );

            script.addEventListener(
                "error",
                () => {
                    rejeitar(
                        new Error(
                            "Não foi possível carregar o login Google."
                        )
                    );
                },
                {
                    once: true
                }
            );

            document.head.appendChild(script);
        }
    );
}


/*
    Recebe a credencial depois que o usuário
    seleciona sua conta na janela do Google.
*/
async function processarCredencialGoogle(
    respostaGoogle
) {
    if (
        typeof respostaGoogle?.credential !==
        "string"
    ) {
        mostrarMensagem(
            mensagemGoogle,
            "O Google não forneceu uma credencial válida.",
            "erro"
        );

        return;
    }

    mostrarMensagem(
        mensagemGoogle,
        "Validando sua conta Google..."
    );

    try {
        /*
            Envia a credencial para o backend.

            O frontend não valida o token sozinho.
        */
        const resultado =
            await chamarApi(
                "/auth/google",
                {
                    method: "POST",

                    body: JSON.stringify({
                        credential:
                            respostaGoogle.credential
                    })
                }
            );

        usuarioAtual =
            resultado.data.usuario;

        atualizarCabecalho();

        await window.CarrinhoVya
    ?.recarregar();

        mostrarMensagem(
            mensagemGoogle,
            "Login com Google realizado com sucesso.",
            "sucesso"
        );

        window.setTimeout(() => {
            fecharModal();
        }, 900);
    } catch (erro) {
        mostrarMensagem(
            mensagemGoogle,
            erro.message,
            "erro"
        );
    }
}


/*
    Busca o Client ID público no backend,
    inicializa o Google e cria o botão.
*/
async function inicializarLoginGoogle() {
    if (
        !areaBotaoGoogle ||
        !mensagemGoogle
    ) {
        return;
    }

    try {
        /*
            As duas operações acontecem juntas:

            1. buscar a configuração no backend;
            2. carregar a biblioteca do Google.
        */
        const [
            configuracao
        ] = await Promise.all([
            chamarApi(
                "/config/public",
                {
                    method: "GET"
                }
            ),

            carregarBibliotecaGoogle()
        ]);

        const googleClientId =
            configuracao?.data?.googleClientId;

        if (
            typeof googleClientId !== "string" ||
            !googleClientId.endsWith(
                ".apps.googleusercontent.com"
            )
        ) {
            throw new Error(
                "O login Google não está configurado."
            );
        }

        /*
            Inicializa o Google Identity Services.
        */
        window.google.accounts.id.initialize({
            client_id: googleClientId,

            callback:
                processarCredencialGoogle,

            ux_mode: "popup",

            auto_select: false
        });

        /*
            Desenha o botão oficial dentro
            de #auth-google-botao.
        */
        window.google.accounts.id.renderButton(
            areaBotaoGoogle,
            {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "pill",
                logo_alignment: "left",
                width: 280
            }
        );
    } catch (erro) {
        mostrarMensagem(
            mensagemGoogle,
            erro.message,
            "erro"
        );
    }
}''


    function selecionarAba(nome) {
        const mostrarLogin =
            nome === "login";

        document.querySelector(
            "#painel-login"
        ).hidden = !mostrarLogin;

        document.querySelector(
            "#painel-cadastro"
        ).hidden = mostrarLogin;

        document.querySelector(
            "#aba-login"
        ).setAttribute(
            "aria-selected",
            String(mostrarLogin)
        );

        document.querySelector(
            "#aba-cadastro"
        ).setAttribute(
            "aria-selected",
            String(!mostrarLogin)
        );
    }


    function atualizarCabecalho() {
        if (!botaoConta) {
            return;
        }

        if (usuarioAtual) {
            const primeiroNome =
                usuarioAtual.nome
                    .trim()
                    .split(/\s+/)[0];

            botaoConta.textContent =
                `Olá, ${primeiroNome}`;

            botaoConta.setAttribute(
                "aria-label",
                "Abrir minha conta"
            );

            window.dispatchEvent(
                new CustomEvent(
                    "vya:autenticacao-alterada",
                    {
                        detail: {
                            usuario: usuarioAtual
                        }
                    }
                )
            );

            return;
        }

        botaoConta.textContent =
            "Entrar / Cadastrar";

        botaoConta.setAttribute(
            "aria-label",
            "Entrar ou criar conta"
        );

        window.dispatchEvent(
            new CustomEvent(
                "vya:autenticacao-alterada",
                {
                    detail: {
                        usuario: null
                    }
                }
            )
        );
    }


    function abrirModal(aba = "login") {
        focoAnterior =
            document.activeElement;

        if (usuarioAtual) {
            areaVisitante.hidden = true;
            areaLogada.hidden = false;

            document.querySelector(
                "#auth-usuario-nome"
            ).textContent =
                usuarioAtual.nome;

            document.querySelector(
                "#auth-usuario-email"
            ).textContent =
                usuarioAtual.email;
        } else {
            areaVisitante.hidden = false;
            areaLogada.hidden = true;

            selecionarAba(aba);
        }

        modal.hidden = false;
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "auth-modal-aberto"
        );

        window.requestAnimationFrame(() => {
            if (usuarioAtual) {
                janela.focus();
                return;
            }

            const campo = aba === "cadastro"
                ? document.querySelector(
                    "#auth-cadastro-nome"
                )
                : document.querySelector(
                    "#auth-login-email"
                );

            campo.focus();
        });
    }


    function fecharModal() {
        modal.hidden = true;
        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "auth-modal-aberto"
        );

        if (
            focoAnterior &&
            typeof focoAnterior.focus ===
                "function"
        ) {
            focoAnterior.focus();
        }
    }


    async function verificarSessao() {
        try {
            const resultado =
                await chamarApi(
                    "/auth/me",
                    {
                        method: "GET"
                    }
                );

            usuarioAtual =
                resultado.data.usuario;

            atualizarCabecalho();
        } catch (erro) {
            usuarioAtual = null;
            atualizarCabecalho();

            /*
                Só exibimos automaticamente quando
                o backend respondeu normalmente
                informando que não há login.
            */
            if (erro.status !== 401) {
                return;
            }

            let conviteJaExibido = false;

            try {
                conviteJaExibido =
                    sessionStorage.getItem(
                        CHAVE_CONVITE_EXIBIDO
                    ) === "true";
            } catch {
                conviteJaExibido = true;
            }

            if (conviteJaExibido) {
                return;
            }

            window.setTimeout(() => {
                if (usuarioAtual) {
                    return;
                }

                try {
                    sessionStorage.setItem(
                        CHAVE_CONVITE_EXIBIDO,
                        "true"
                    );
                } catch {
                    // O modal continuará funcionando.
                }

                abrirModal("login");
            }, 4000);
        }
    }


    document
        .querySelectorAll("[data-auth-aba]")
        .forEach((botao) => {
            botao.addEventListener(
                "click",
                () => {
                    selecionarAba(
                        botao.dataset.authAba
                    );
                }
            );
        });


    document
        .querySelectorAll("[data-fechar-auth]")
        .forEach((elemento) => {
            elemento.addEventListener(
                "click",
                fecharModal
            );
        });


    if (botaoConta) {
        botaoConta.addEventListener(
            "click",
            (evento) => {
                evento.preventDefault();
                abrirModal("login");
            }
        );
    }


    formularioLogin.addEventListener(
        "submit",
        async (evento) => {
            evento.preventDefault();

            botaoLogin.disabled = true;
            botaoLogin.textContent =
                "Entrando...";

            mostrarMensagem(
                mensagemLogin,
                ""
            );

            const dados =
                new FormData(
                    formularioLogin
                );

            try {
                const resultado =
                    await chamarApi(
                        "/auth/login",
                        {
                            method: "POST",

                            body: JSON.stringify({
                                email: String(
                                    dados.get(
                                        "email"
                                    )
                                ).trim(),

                                senha: String(
                                    dados.get(
                                        "senha"
                                    )
                                )
                            })
                        }
                    );

                usuarioAtual =
                    resultado.data.usuario;

                formularioLogin.reset();
                atualizarCabecalho();

                await window.CarrinhoVya
    ?.recarregar();

                mostrarMensagem(
                    mensagemLogin,
                    "Login realizado com sucesso.",
                    "sucesso"
                );

                window.setTimeout(() => {
                    fecharModal();
                }, 900);
            } catch (erro) {
                mostrarMensagem(
                    mensagemLogin,
                    erro.message,
                    "erro"
                );
            } finally {
                botaoLogin.disabled = false;
                botaoLogin.textContent =
                    "Entrar";
            }
        }
    );


    formularioCadastro.addEventListener(
        "submit",
        async (evento) => {
            evento.preventDefault();

            const dados =
                new FormData(
                    formularioCadastro
                );

            const senha =
                String(dados.get("senha"));

            const confirmacaoSenha =
                String(
                    dados.get(
                        "confirmacaoSenha"
                    )
                );

            if (senha !== confirmacaoSenha) {
                mostrarMensagem(
                    mensagemCadastro,
                    "As senhas precisam ser iguais.",
                    "erro"
                );

                return;
            }

            botaoCadastro.disabled = true;
            botaoCadastro.textContent =
                "Criando conta...";

            mostrarMensagem(
                mensagemCadastro,
                ""
            );

            const email = String(
                dados.get("email")
            ).trim();

            try {
                await chamarApi(
                    "/auth/cadastro",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            nome: String(
                                dados.get("nome")
                            ).trim(),

                            email,
                            senha,
                            confirmacaoSenha
                        })
                    }
                );

                formularioCadastro.reset();
                selecionarAba("login");

                document.querySelector(
                    "#auth-login-email"
                ).value = email;

                mostrarMensagem(
                    mensagemLogin,
                    "Cadastro concluído. Agora entre na sua conta.",
                    "sucesso"
                );
            } catch (erro) {
                mostrarMensagem(
                    mensagemCadastro,
                    erro.message,
                    "erro"
                );
            } finally {
                botaoCadastro.disabled = false;
                botaoCadastro.textContent =
                    "Criar conta";
            }
        }
    );


    botaoLogout.addEventListener(
        "click",
        async () => {
            botaoLogout.disabled = true;
            botaoLogout.textContent =
                "Saindo...";

            mostrarMensagem(
                mensagemLogout,
                ""
            );

            try {
                await chamarApi(
                    "/auth/logout",
                    {
                        method: "POST"
                    }
                );

                localStorage.removeItem("vyacarrinho");

                    usuarioAtual = null;
                    atualizarCabecalho();
                    window.CarrinhoVya
    ?.zerarContador();
                    fecharModal();
                    window.location.reload();
            } catch (erro) {
                mostrarMensagem(
                    mensagemLogout,
                    erro.message,
                    "erro"
                );
            } finally {
                botaoLogout.disabled = false;
                botaoLogout.textContent =
                    "Sair da conta";
            }
        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {
            if (modal.hidden) {
                return;
            }

            if (evento.key === "Escape") {
                fecharModal();
                return;
            }

            if (evento.key !== "Tab") {
                return;
            }

            const focaveis = [
                ...janela.querySelectorAll(
                    `
                        a[href],
                        button:not([disabled]),
                        input:not([disabled]),
                        [tabindex]:not([tabindex="-1"])
                    `
                )
            ].filter(
                (elemento) =>
                    elemento.offsetParent !== null
            );

            if (focaveis.length === 0) {
                return;
            }

            const primeiro = focaveis[0];
            const ultimo =
                focaveis[focaveis.length - 1];

            if (
                evento.shiftKey &&
                document.activeElement ===
                    primeiro
            ) {
                evento.preventDefault();
                ultimo.focus();
            } else if (
                !evento.shiftKey &&
                document.activeElement ===
                    ultimo
            ) {
                evento.preventDefault();
                primeiro.focus();
            }
        }
    );


    /*
        Corrige o caminho do carrinho quando
        o modal estiver dentro da pasta pages.
    */
    const linkCarrinho =
        document.querySelector(
            "#auth-link-carrinho"
        );

    const linkPedidos =
        document.querySelector(
            "#auth-link-pedidos"
        );

    if (
        window.location.pathname.includes(
            "/pages/"
        )
    ) {
        linkCarrinho.href =
            "carrinho.html";

        linkPedidos.href =
            "pedidos.html";
    }


    inicializarLoginGoogle();
verificarSessao();
})();
