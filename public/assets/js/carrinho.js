(function () {
    "use strict";

    const API_CARRINHO_URL =
        "http://localhost:3000/api/carrinho";

    const formatarMoeda = new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

    let interfaceCarrinho = null;
    let painelCarrinho = null;
    let listaItens = null;
    let estadoCarrinho = null;
    let resumoCarrinho = null;
    let mensagemCarrinho = null;
    let botaoEsvaziar = null;
    let botaoFinalizar = null;
    let elementoFocadoAntesDeAbrir = null;
    let carrinhoAtual = null;

    function criarInterface() {
        const elemento = document.createElement("div");

        elemento.id = "carrinho-interface";
        elemento.className = "carrinho-interface";
        elemento.hidden = true;

        elemento.innerHTML = `
            <div
                class="carrinho-interface__fundo"
                data-fechar-carrinho
            ></div>

            <aside
                class="carrinho-painel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="carrinho-titulo"
                tabindex="-1"
            >
                <header class="carrinho-painel__cabecalho">
                    <div>
                        <span class="carrinho-painel__legenda">
                            SUA COMPRA
                        </span>
                        <h2 id="carrinho-titulo">
                            Meu carrinho
                        </h2>
                    </div>

                    <button
                        class="carrinho-painel__fechar"
                        type="button"
                        data-fechar-carrinho
                        aria-label="Fechar carrinho"
                    >
                        &times;
                    </button>
                </header>

                <p
                    id="carrinho-mensagem"
                    class="carrinho-mensagem"
                    role="status"
                    aria-live="polite"
                    hidden
                ></p>

                <div
                    id="carrinho-estado"
                    class="carrinho-estado"
                >
                    Carregando seu carrinho...
                </div>

                <div
                    id="carrinho-lista"
                    class="carrinho-lista"
                    aria-live="polite"
                ></div>

                <footer
                    id="carrinho-resumo"
                    class="carrinho-resumo"
                    hidden
                >
                    <div class="carrinho-resumo__linha">
                        <span>Quantidade</span>
                        <strong id="carrinho-resumo-quantidade">
                            0 itens
                        </strong>
                    </div>

                    <div class="carrinho-resumo__linha carrinho-resumo__total">
                        <span>Total</span>
                        <strong id="carrinho-resumo-total">
                            R$ 0,00
                        </strong>
                    </div>

                    <button
                        id="carrinho-finalizar"
                        class="carrinho-finalizar"
                        type="button"
                    >
                        Finalizar compra
                    </button>

                    <button
                        id="carrinho-esvaziar"
                        class="carrinho-esvaziar"
                        type="button"
                    >
                        Esvaziar carrinho
                    </button>
                </footer>
            </aside>
        `;

        document.body.appendChild(elemento);

        interfaceCarrinho = elemento;
        painelCarrinho = elemento.querySelector(
            ".carrinho-painel"
        );
        listaItens = elemento.querySelector(
            "#carrinho-lista"
        );
        estadoCarrinho = elemento.querySelector(
            "#carrinho-estado"
        );
        resumoCarrinho = elemento.querySelector(
            "#carrinho-resumo"
        );
        mensagemCarrinho = elemento.querySelector(
            "#carrinho-mensagem"
        );
        botaoEsvaziar = elemento.querySelector(
            "#carrinho-esvaziar"
        );
        botaoFinalizar = elemento.querySelector(
            "#carrinho-finalizar"
        );

        elemento
            .querySelectorAll("[data-fechar-carrinho]")
            .forEach((botao) => {
                botao.addEventListener(
                    "click",
                    fecharCarrinho
                );
            });

        botaoEsvaziar.addEventListener(
            "click",
            esvaziarCarrinho
        );

        botaoFinalizar.addEventListener(
            "click",
            () => {
                const estaEmPages =
                    window.location.pathname.includes(
                        "/pages/"
                    );

                window.location.href = estaEmPages
                    ? "checkout.html"
                    : "pages/checkout.html";
            }
        );
    }

    async function chamarApi(caminho = "", opcoes = {}) {
        const configuracao = {
            credentials: "include",
            ...opcoes,
            headers: {
                ...opcoes.headers
            }
        };

        if (configuracao.body) {
            configuracao.headers["Content-Type"] =
                "application/json";
        }

        const resposta = await fetch(
            `${API_CARRINHO_URL}${caminho}`,
            configuracao
        );

        let resultado = null;

        try {
            resultado = await resposta.json();
        } catch (erro) {
            resultado = null;
        }

        if (!resposta.ok) {
            const erro = new Error(
                resultado?.message ||
                    "Não foi possível acessar o carrinho."
            );

            erro.status = resposta.status;
            erro.codigo = resultado?.code;

            throw erro;
        }

        return resultado;
    }

    function obterCarrinho(resultado) {
        return resultado?.data?.carrinho || null;
    }

    function mostrarMensagem(texto, tipo = "erro") {
        mensagemCarrinho.textContent = texto;
        mensagemCarrinho.className =
            `carrinho-mensagem carrinho-mensagem--${tipo}`;
        mensagemCarrinho.hidden = false;
    }

    function limparMensagem() {
        mensagemCarrinho.textContent = "";
        mensagemCarrinho.hidden = true;
    }

    function mostrarCarregamento() {
        limparMensagem();
        listaItens.replaceChildren();
        estadoCarrinho.textContent =
            "Carregando seu carrinho...";
        estadoCarrinho.hidden = false;
        resumoCarrinho.hidden = true;
    }

    function atualizarContadorGeral(carrinho) {
        if (window.CarrinhoVya?.atualizarContador) {
            window.CarrinhoVya.atualizarContador(
                carrinho
            );
            return;
        }

        const contador = document.querySelector(
            "#quantidade-carrinho"
        );

        if (contador) {
            contador.textContent = String(
                carrinho?.quantidadeTotal || 0
            );
        }
    }

    function criarImagemItem(item) {
        const areaImagem = document.createElement("div");
        areaImagem.className = "carrinho-item__imagem";

        if (item.imagemUrl) {
            const imagem = document.createElement("img");
            imagem.src = item.imagemUrl;
            imagem.alt = item.nome;
            imagem.loading = "lazy";
            areaImagem.appendChild(imagem);
        } else {
            const sigla = document.createElement("span");
            sigla.textContent = "VYA";
            sigla.setAttribute("aria-hidden", "true");
            areaImagem.appendChild(sigla);
        }

        return areaImagem;
    }

    function criarBotaoQuantidade(
        simbolo,
        rotulo,
        aoClicar,
        desabilitado = false
    ) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "carrinho-quantidade__botao";
        botao.textContent = simbolo;
        botao.setAttribute("aria-label", rotulo);
        botao.disabled = desabilitado;
        botao.addEventListener("click", aoClicar);
        return botao;
    }

    function criarItem(item) {
        const elemento = document.createElement("article");
        elemento.className = "carrinho-item";
        elemento.dataset.itemId = item.id;

        const informacoes = document.createElement("div");
        informacoes.className = "carrinho-item__informacoes";

        const categoria = document.createElement("span");
        categoria.className = "carrinho-item__categoria";
        categoria.textContent = item.categoria || "Produto VYA";

        const nome = document.createElement("h3");
        nome.textContent = item.nome;

        const variante = document.createElement("p");
        variante.className = "carrinho-item__variante";
        variante.textContent =
            `${item.tamanho} • ${item.cor}`;

        const preco = document.createElement("strong");
        preco.className = "carrinho-item__preco";
        preco.textContent = formatarMoeda.format(
            Number(item.subtotal)
        );

        const acoes = document.createElement("div");
        acoes.className = "carrinho-item__acoes";

        const quantidade = document.createElement("div");
        quantidade.className = "carrinho-quantidade";
        quantidade.setAttribute(
            "aria-label",
            `Quantidade de ${item.nome}`
        );

        const valorQuantidade = document.createElement("span");
        valorQuantidade.textContent = String(item.quantidade);
        valorQuantidade.setAttribute("aria-live", "polite");

        quantidade.append(
            criarBotaoQuantidade(
                "−",
                `Diminuir quantidade de ${item.nome}`,
                () => alterarQuantidade(
                    item,
                    item.quantidade - 1
                ),
                item.quantidade <= 1
            ),
            valorQuantidade,
            criarBotaoQuantidade(
                "+",
                `Aumentar quantidade de ${item.nome}`,
                () => alterarQuantidade(
                    item,
                    item.quantidade + 1
                ),
                !item.disponivel ||
                    item.quantidade >= item.estoque
            )
        );

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "carrinho-item__remover";
        remover.textContent = "Remover";
        remover.addEventListener(
            "click",
            () => removerItem(item)
        );

        acoes.append(quantidade, remover);
        informacoes.append(
            categoria,
            nome,
            variante,
            preco,
            acoes
        );

        elemento.append(criarImagemItem(item), informacoes);

        if (!item.disponivel) {
            elemento.classList.add(
                "carrinho-item--indisponivel"
            );
        }

        return elemento;
    }

    function renderizarCarrinho(carrinho) {
        carrinhoAtual = carrinho;
        limparMensagem();
        listaItens.replaceChildren();
        atualizarContadorGeral(carrinho);

        const itens = carrinho?.itens || [];

        if (itens.length === 0) {
            estadoCarrinho.innerHTML = `
                <strong>Seu carrinho está vazio.</strong>
                <span>
                    Escolha seus produtos VYA e volte aqui
                    para conferir a compra.
                </span>
            `;
            estadoCarrinho.hidden = false;
            resumoCarrinho.hidden = true;
            return;
        }

        estadoCarrinho.hidden = true;

        itens.forEach((item) => {
            listaItens.appendChild(criarItem(item));
        });

        const quantidade = Number(
            carrinho.quantidadeTotal || 0
        );

        interfaceCarrinho.querySelector(
            "#carrinho-resumo-quantidade"
        ).textContent =
            `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;

        interfaceCarrinho.querySelector(
            "#carrinho-resumo-total"
        ).textContent = formatarMoeda.format(
            Number(carrinho.total || 0)
        );

        resumoCarrinho.hidden = false;
    }

    function bloquearItem(itemId, bloquear) {
        const elemento = listaItens.querySelector(
            `[data-item-id="${CSS.escape(itemId)}"]`
        );

        if (!elemento) {
            return;
        }

        elemento.classList.toggle(
            "carrinho-item--carregando",
            bloquear
        );

        elemento
            .querySelectorAll("button")
            .forEach((botao) => {
                botao.disabled = bloquear;
            });
    }

    async function carregarCarrinho() {
        mostrarCarregamento();

        try {
            const resultado = await chamarApi();
            renderizarCarrinho(obterCarrinho(resultado));
        } catch (erro) {
            if (erro.status === 401) {
                fecharCarrinho();
                window.CarrinhoVya?.zerarContador?.();
                document.querySelector("#botao-conta")?.click();
                return;
            }

            estadoCarrinho.textContent =
                "Não foi possível carregar seu carrinho.";
            estadoCarrinho.hidden = false;
            mostrarMensagem(erro.message);
        }
    }

    async function alterarQuantidade(item, novaQuantidade) {
        if (novaQuantidade < 1) {
            return;
        }

        limparMensagem();
        bloquearItem(item.id, true);

        try {
            const resultado = await chamarApi(
                `/itens/${encodeURIComponent(item.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        quantidade: novaQuantidade
                    })
                }
            );

            renderizarCarrinho(obterCarrinho(resultado));
        } catch (erro) {
            bloquearItem(item.id, false);
            mostrarMensagem(erro.message);
        }
    }

    async function removerItem(item) {
        limparMensagem();
        bloquearItem(item.id, true);

        try {
            const resultado = await chamarApi(
                `/itens/${encodeURIComponent(item.id)}`,
                {
                    method: "DELETE"
                }
            );

            renderizarCarrinho(obterCarrinho(resultado));
        } catch (erro) {
            bloquearItem(item.id, false);
            mostrarMensagem(erro.message);
        }
    }

    async function esvaziarCarrinho() {
        if (!carrinhoAtual?.itens?.length) {
            return;
        }

        const confirmou = window.confirm(
            "Deseja remover todos os produtos do carrinho?"
        );

        if (!confirmou) {
            return;
        }

        limparMensagem();
        botaoEsvaziar.disabled = true;

        try {
            const resultado = await chamarApi("", {
                method: "DELETE"
            });

            renderizarCarrinho(obterCarrinho(resultado));
        } catch (erro) {
            mostrarMensagem(erro.message);
        } finally {
            botaoEsvaziar.disabled = false;
        }
    }

    function abrirCarrinho(evento) {
        evento?.preventDefault();

        if (!interfaceCarrinho) {
            criarInterface();
        }

        elementoFocadoAntesDeAbrir =
            document.activeElement;

        interfaceCarrinho.hidden = false;
        document.body.classList.add("carrinho-aberto");

        window.requestAnimationFrame(() => {
            interfaceCarrinho.classList.add(
                "carrinho-interface--aberta"
            );
            painelCarrinho.focus();
        });

        carregarCarrinho();
    }

    function fecharCarrinho() {
        if (!interfaceCarrinho || interfaceCarrinho.hidden) {
            return;
        }

        interfaceCarrinho.classList.remove(
            "carrinho-interface--aberta"
        );
        document.body.classList.remove("carrinho-aberto");

        window.setTimeout(() => {
            interfaceCarrinho.hidden = true;
            elementoFocadoAntesDeAbrir?.focus?.();
        }, 260);
    }

    function aoPressionarTecla(evento) {
        if (
            evento.key === "Escape" &&
            interfaceCarrinho &&
            !interfaceCarrinho.hidden
        ) {
            fecharCarrinho();
        }
    }

    function iniciar() {
        document
            .querySelectorAll(".carrinho-link")
            .forEach((link) => {
                link.addEventListener(
                    "click",
                    abrirCarrinho
                );
            });

        document.addEventListener(
            "keydown",
            aoPressionarTecla
        );

        window.InterfaceCarrinhoVya = {
            abrir: abrirCarrinho,
            fechar: fecharCarrinho,
            recarregar: carregarCarrinho
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            { once: true }
        );
    } else {
        iniciar();
    }
})();
