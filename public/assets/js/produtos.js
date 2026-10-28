(() => {
    "use strict";

    const URL_API_PRODUTOS =
        "http://localhost:3000/api/produtos";
    const URL_API_CARRINHO =
        "http://localhost:3000/api/carrinho/itens";
    const CATEGORIAS_PUBLICAS = Object.freeze({
    fitness: {
        nome: "Fitness",
        titulo: "Produtos Fitness"
    },
    "moda-praia": {
        nome: "Praia & Lazer",
        titulo: "Produtos de Moda Praia"
    },
    natacao: {
        nome: "Natação & Performace",
        titulo: "Produtos de Natação"
    }
});

const parametrosPagina = new URLSearchParams(
    window.location.search
);

const categoriaSlug = (
    parametrosPagina.get("categoria") ?? ""
)
    .trim()
    .toLowerCase();

const categoriaAtual =
    CATEGORIAS_PUBLICAS[categoriaSlug] ?? null;
    const CANAL_CATALOGO = "vya-catalogo";
    const CHAVE_CATALOGO_ATUALIZADO =
        "vyaCatalogoAtualizadoEm";

    const moeda = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    const grade = document.querySelector(".produtos");

    if (!grade) {
        return;
    }

    const limiteProdutos = Number.parseInt(
    grade.dataset.limite ?? "",
    10
);

    const estado = {
        adicionando: new Set(),
        carregando: false,
        ultimaAtualizacao: 0
    };
    const canalCatalogo = "BroadcastChannel" in window
        ? new BroadcastChannel(CANAL_CATALOGO)
        : null;

    function criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        if (texto !== undefined) {
            elemento.textContent = texto;
        }

        return elemento;
    }
    
    function obterNomeCategoriaExibicao(categoria) {
    const nomes = {
        "Fitness": "Fitness",
        "Moda praia": "Praia & Lazer",
        "Natação": "Natação & Performance"
    };

    return nomes[categoria] ?? categoria;
}

    async function lerResposta(resposta) {
        try {
            return await resposta.json();
        } catch {
            return null;
        }
    }

    async function buscarProdutos() {
    if (categoriaSlug && !categoriaAtual) {
        throw new Error(
            "A categoria selecionada não existe."
        );
    }

    const url = new URL(URL_API_PRODUTOS);

    if (categoriaSlug) {
        url.searchParams.set(
            "categoria",
            categoriaSlug
        );
    }

    const resposta = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json"
        }
    });

    const resultado = await lerResposta(resposta);

    if (!resposta.ok) {
        throw new Error(
            resultado?.message ||
            "Não foi possível carregar os produtos."
        );
    }

    return resultado?.data?.produtos ?? [];
}
    async function adicionarAoCarrinho(varianteId) {
        const resposta = await fetch(URL_API_CARRINHO, {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                produtoVarianteId: varianteId,
                quantidade: 1
            })
        });
        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
            const erro = new Error(
                resultado?.message ||
                "Não foi possível adicionar o produto."
            );
            erro.status = resposta.status;
            throw erro;
        }

        return resultado;
    }

    function varianteSelecionavel(produto) {
        return produto.variantes.find(
            (variante) => variante.disponivel
        ) ?? produto.variantes[0] ?? null;
    }

    function criarImagem(produto, variante) {
        const area = criarElemento(
            "div",
            "produto-imagem produto-imagem--dinamica"
        );
        const imagem = document.createElement("img");
        const placeholder = criarElemento(
            "span",
            "produto-imagem-placeholder",
            "VYA"
        );
        let urlAtual = null;

        imagem.alt = `Foto de ${produto.nome}`;
        imagem.loading = "lazy";

        function atualizarImagem(url) {
            urlAtual = url || null;

            if (url) {
                imagem.src = url;
                imagem.hidden = false;
                placeholder.hidden = true;
            } else {
                imagem.removeAttribute("src");
                imagem.hidden = true;
                placeholder.hidden = false;
            }
        }

        imagem.addEventListener("error", () => {
            imagem.hidden = true;
            placeholder.hidden = false;
        });

        atualizarImagem(variante?.imagemUrl);
        area.append(imagem, placeholder);

        return {
            area,
            elemento: imagem,
            atualizarImagem,
            obterUrl: () => urlAtual
        };
    }

    function abrirZoomImagem(produto, url) {
        if (!url) {
            return;
        }

        const modal = criarElemento("div", "produto-zoom");
        const fundo = criarElemento(
            "button",
            "produto-zoom__fundo"
        );
        const janela = criarElemento(
            "section",
            "produto-zoom__janela"
        );
        const cabecalho = criarElemento(
            "div",
            "produto-zoom__cabecalho"
        );
        const titulo = criarElemento(
            "h2",
            "",
            `Detalhes de ${produto.nome}`
        );
        const controles = criarElemento(
            "div",
            "produto-zoom__controles"
        );
        const diminuir = criarElemento(
            "button",
            "produto-zoom__controle",
            "−"
        );
        const nivel = criarElemento(
            "button",
            "produto-zoom__nivel",
            "100%"
        );
        const aumentar = criarElemento(
            "button",
            "produto-zoom__controle",
            "+"
        );
        const fecharBotao = criarElemento(
            "button",
            "produto-zoom__fechar",
            "×"
        );
        const palco = criarElemento(
            "div",
            "produto-zoom__palco"
        );
        const tela = criarElemento(
            "div",
            "produto-zoom__tela"
        );
        const imagem = document.createElement("img");
        let escala = 1;

        fundo.type = "button";
        fundo.setAttribute("aria-label", "Fechar ampliação");
        diminuir.type = "button";
        diminuir.setAttribute("aria-label", "Diminuir zoom");
        nivel.type = "button";
        nivel.setAttribute("aria-label", "Restaurar zoom");
        aumentar.type = "button";
        aumentar.setAttribute("aria-label", "Aumentar zoom");
        fecharBotao.type = "button";
        fecharBotao.setAttribute("aria-label", "Fechar ampliação");
        janela.setAttribute("role", "dialog");
        janela.setAttribute("aria-modal", "true");
        janela.setAttribute("aria-label", `Imagem ampliada de ${produto.nome}`);
        palco.tabIndex = 0;
        imagem.src = url;
        imagem.alt = `Imagem ampliada de ${produto.nome}`;
        imagem.draggable = false;

        function aplicarEscala(centralizar = true) {
            tela.style.width = `${escala * 100}%`;
            tela.style.height = `${escala * 100}%`;
            nivel.textContent = `${Math.round(escala * 100)}%`;
            diminuir.disabled = escala <= 1;
            aumentar.disabled = escala >= 4;

            if (centralizar) {
                window.requestAnimationFrame(() => {
                    palco.scrollLeft =
                        (palco.scrollWidth - palco.clientWidth) / 2;
                    palco.scrollTop =
                        (palco.scrollHeight - palco.clientHeight) / 2;
                });
            }
        }

        function alterarEscala(diferenca) {
            escala = Math.min(
                4,
                Math.max(1, escala + diferenca)
            );
            aplicarEscala();
        }

        function fechar() {
            modal.remove();
        }

        diminuir.addEventListener("click", () => {
            alterarEscala(-0.5);
        });
        aumentar.addEventListener("click", () => {
            alterarEscala(0.5);
        });
        nivel.addEventListener("click", () => {
            escala = 1;
            aplicarEscala();
        });
        palco.addEventListener("wheel", (evento) => {
            evento.preventDefault();
            alterarEscala(evento.deltaY < 0 ? 0.25 : -0.25);
        }, { passive: false });
        imagem.addEventListener("dblclick", () => {
            escala = escala === 1 ? 2.5 : 1;
            aplicarEscala();
        });
        fundo.addEventListener("click", fechar);
        fecharBotao.addEventListener("click", fechar);
        modal.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape") {
                fechar();
            } else if (evento.key === "+" || evento.key === "=") {
                alterarEscala(0.5);
            } else if (evento.key === "-") {
                alterarEscala(-0.5);
            } else if (evento.key === "0") {
                escala = 1;
                aplicarEscala();
            }
        });

        controles.append(diminuir, nivel, aumentar);
        cabecalho.append(titulo, controles, fecharBotao);
        tela.append(imagem);
        palco.append(tela);
        janela.append(cabecalho, palco);
        modal.append(fundo, janela);
        document.body.append(modal);
        aplicarEscala(false);
        fecharBotao.focus();
    }

    function abrirSeletorProduto(produto) {
        const variantes = produto.variantes;
        const primeiraDisponivel = varianteSelecionavel(produto);
        let corAtual = primeiraDisponivel?.cor ??
            variantes[0]?.cor ?? "";
        let varianteAtual = primeiraDisponivel;

        const modal = criarElemento(
            "div",
            "produto-seletor-modal"
        );
        const fundo = criarElemento(
            "button",
            "produto-seletor-modal__fundo"
        );
        const janela = criarElemento(
            "section",
            "produto-seletor-modal__janela"
        );
        const fecharBotao = criarElemento(
            "button",
            "produto-seletor-modal__fechar",
            "×"
        );
        const gradeModal = criarElemento(
            "div",
            "produto-seletor-modal__grade"
        );
        const imagem = criarImagem(produto, varianteAtual);
        const conteudo = criarElemento(
            "div",
            "produto-seletor-modal__conteudo"
        );
        const categoria = criarElemento(
    "p",
    "produto-categoria",
    obterNomeCategoriaExibicao(
        produto.categoria
    )
);
        const titulo = criarElemento("h2", "", produto.nome);
        const descricao = criarElemento(
            "p",
            "produto-descricao",
            produto.descricao || "Escolha a opção desejada."
        );
        const legendaCor = criarElemento(
            "strong",
            "produto-seletor-modal__legenda",
            "Cor"
        );
        const coresArea = criarElemento(
            "div",
            "produto-seletor-cores"
        );
        const tamanhosGrupo = criarElemento(
            "label",
            "produto-seletor-tamanhos"
        );
        const tamanhosLegenda = criarElemento(
            "span",
            "",
            "Tamanho"
        );
        const tamanhos = document.createElement("select");
        const preco = criarElemento("p", "preco");
        const estoque = criarElemento("p", "produto-estoque");
        const mensagem = criarElemento(
            "p",
            "produto-mensagem"
        );
        const adicionar = criarElemento(
            "button",
            "botao botao--principal",
            "Adicionar ao carrinho"
        );

        fundo.type = "button";
        fundo.setAttribute("aria-label", "Fechar seleção");
        fecharBotao.type = "button";
        fecharBotao.setAttribute("aria-label", "Fechar");
        adicionar.type = "button";
        janela.setAttribute("role", "dialog");
        janela.setAttribute("aria-modal", "true");
        janela.setAttribute(
            "aria-label",
            `Escolher opções de ${produto.nome}`
        );
        imagem.area.classList.add(
            "produto-seletor-modal__imagem"
        );
        imagem.elemento.classList.add(
            "produto-seletor-modal__imagem-clicavel"
        );
        imagem.elemento.tabIndex = 0;
        imagem.elemento.setAttribute("role", "button");
        imagem.elemento.setAttribute(
            "aria-label",
            `Ampliar imagem de ${produto.nome}`
        );
        const ampliarImagem = criarElemento(
            "button",
            "produto-imagem-ampliar",
            "Ampliar imagem"
        );
        ampliarImagem.type = "button";
        ampliarImagem.addEventListener("click", () => {
            abrirZoomImagem(produto, imagem.obterUrl());
        });
        imagem.elemento.addEventListener("click", () => {
            abrirZoomImagem(produto, imagem.obterUrl());
        });
        imagem.elemento.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirZoomImagem(produto, imagem.obterUrl());
            }
        });
        imagem.area.append(ampliarImagem);

        const cores = [...new Set(
            variantes.map((variante) => variante.cor)
        )];

        function fechar() {
            modal.remove();
            document.body.classList.remove(
                "produto-seletor-aberto"
            );
        }

        function atualizarDetalhes() {
            preco.textContent = varianteAtual
                ? moeda.format(varianteAtual.preco)
                : "Indisponível";
            estoque.textContent = !varianteAtual
                ? "Opção indisponível"
                : varianteAtual.disponivel
                    ? `${varianteAtual.estoque} em estoque`
                    : "Esta opção está esgotada";
            estoque.dataset.disponivel =
                varianteAtual?.disponivel ? "true" : "false";
            adicionar.disabled = !varianteAtual?.disponivel;
            adicionar.textContent = varianteAtual?.disponivel
                ? "Adicionar ao carrinho"
                : "Opção esgotada";
            imagem.atualizarImagem(varianteAtual?.imagemUrl);
            ampliarImagem.hidden = !varianteAtual?.imagemUrl;
            imagem.elemento.tabIndex = varianteAtual?.imagemUrl
                ? 0
                : -1;
            mensagem.textContent = "";
        }

        function atualizarTamanhos() {
            const variantesDaCor = variantes.filter(
                (variante) => variante.cor === corAtual
            );
            varianteAtual = variantesDaCor.find(
                (variante) => variante.disponivel
            ) ?? variantesDaCor[0] ?? null;

            tamanhos.replaceChildren();

            variantesDaCor.forEach((variante) => {
                const opcao = document.createElement("option");
                opcao.value = variante.id;
                opcao.textContent = variante.disponivel
                    ? variante.tamanho
                    : `${variante.tamanho} — esgotado`;
                opcao.disabled = !variante.disponivel;
                opcao.selected =
                    variante.id === varianteAtual?.id;
                tamanhos.append(opcao);
            });

            atualizarDetalhes();
        }

        cores.forEach((cor) => {
            const variantesDaCor = variantes.filter(
                (variante) => variante.cor === cor
            );
            const possuiEstoque = variantesDaCor.some(
                (variante) => variante.disponivel
            );
            const botaoCor = criarElemento(
                "button",
                "produto-seletor-cor",
                cor
            );

            botaoCor.type = "button";
            botaoCor.disabled = !possuiEstoque;
            botaoCor.dataset.selecionada = String(
                cor === corAtual
            );
            botaoCor.addEventListener("click", () => {
                corAtual = cor;
                coresArea.querySelectorAll("button")
                    .forEach((botao) => {
                        botao.dataset.selecionada = String(
                            botao === botaoCor
                        );
                    });
                atualizarTamanhos();
            });
            coresArea.append(botaoCor);
        });

        tamanhos.addEventListener("change", () => {
            varianteAtual = variantes.find(
                (variante) => variante.id === tamanhos.value
            ) ?? null;
            atualizarDetalhes();
        });

        adicionar.addEventListener("click", async () => {
            if (
                !varianteAtual?.disponivel ||
                estado.adicionando.has(varianteAtual.id)
            ) {
                return;
            }

            const varianteId = varianteAtual.id;
            estado.adicionando.add(varianteId);
            adicionar.disabled = true;
            adicionar.textContent = "Adicionando...";

            try {
                const resultado = await adicionarAoCarrinho(
                    varianteId
                );

                window.CarrinhoVya?.atualizarContador?.(
                    resultado?.data?.carrinho
                );

                if (window.CarrinhoVya?.recarregar) {
                    await window.CarrinhoVya.recarregar();
                }

                mensagem.textContent =
                    "Produto adicionado ao carrinho.";
                mensagem.dataset.tipo = "sucesso";
                adicionar.textContent = "Adicionado";
                window.setTimeout(fechar, 650);
            } catch (erro) {
                if (erro.status === 401) {
                    fechar();
                    document.querySelector("#botao-conta")?.click();
                    return;
                }

                mensagem.textContent = erro.message;
                mensagem.dataset.tipo = "erro";
                adicionar.disabled = false;
                adicionar.textContent =
                    "Adicionar ao carrinho";
            } finally {
                estado.adicionando.delete(varianteId);
            }
        });

        fundo.addEventListener("click", fechar);
        fecharBotao.addEventListener("click", fechar);

        tamanhosGrupo.append(tamanhosLegenda, tamanhos);
        conteudo.append(
            categoria,
            titulo,
            descricao,
            legendaCor,
            coresArea,
            tamanhosGrupo,
            preco,
            estoque,
            adicionar,
            mensagem
        );
        gradeModal.append(imagem.area, conteudo);
        janela.append(fecharBotao, gradeModal);
        modal.append(fundo, janela);
        document.body.append(modal);
        document.body.classList.add("produto-seletor-aberto");
        atualizarTamanhos();
        fecharBotao.focus();

        modal.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape") {
                fechar();
            }
        });
    }

    function criarCard(produto) {
        const varianteAtual = varianteSelecionavel(produto);
        const variantesDisponiveis = produto.variantes.filter(
            (variante) => variante.disponivel
        );
        const precos = variantesDisponiveis.map(
            (variante) => variante.preco
        );
        const menorPreco = precos.length
            ? Math.min(...precos)
            : null;
        const estoqueTotal = produto.variantes.reduce(
            (total, variante) => total + variante.estoque,
            0
        );
        const card = criarElemento("article", "produto-card");
        const imagem = criarImagem(produto, varianteAtual);
        const conteudo = criarElemento("div", "produto-info");
        const categoria = criarElemento(
    "p",
    "produto-categoria",
    obterNomeCategoriaExibicao(
        produto.categoria
    )
);
        const titulo = criarElemento("h2", "", produto.nome);
        const descricao = criarElemento(
            "p",
            "produto-descricao",
            produto.descricao || "Produto VYA selecionado para você."
        );
        const preco = criarElemento(
            "p",
            "preco",
            menorPreco !== null
                ? `${precos.some((valor) => valor !== menorPreco)
                    ? "A partir de "
                    : ""}${moeda.format(menorPreco)}`
                : "Indisponível"
        );
        const estoque = criarElemento(
            "p",
            "produto-estoque",
            estoqueTotal > 0
                ? `${estoqueTotal} em estoque`
                : "Produto esgotado"
        );
        const botao = criarElemento(
            "button",
            "botao botao--principal",
            variantesDisponiveis.length
                ? "Escolher cor e tamanho"
                : "Esgotado"
        );

        botao.type = "button";
        botao.disabled = variantesDisponiveis.length === 0;
        estoque.dataset.disponivel = String(
            estoqueTotal > 0
        );
        botao.addEventListener("click", () => {
            abrirSeletorProduto(produto);
        });

        conteudo.append(
            categoria,
            titulo,
            descricao,
            preco,
            estoque,
            botao
        );
        card.append(imagem.area, conteudo);

        return card;
    }

    function mostrarCarregamento() {
        const bloco = criarElemento(
            "div",
            "produtos-estado",
            "Carregando produtos..."
        );
        bloco.setAttribute("role", "status");
        grade.replaceChildren(bloco);
    }

    function mostrarErro(mensagem) {
        const bloco = criarElemento("div", "produtos-estado");
        const texto = criarElemento("p", "", mensagem);
        const botao = criarElemento(
            "button",
            "botao botao--principal",
            "Tentar novamente"
        );

        botao.type = "button";
        botao.addEventListener("click", carregar);
        bloco.append(texto, botao);
        grade.replaceChildren(bloco);
    }

    async function carregar(mostrarEstado = true) {
        if (estado.carregando) {
            return;
        }

        estado.carregando = true;

        if (mostrarEstado) {
            mostrarCarregamento();
        }

        try {
            const produtos = await buscarProdutos();

                const produtosExibidos = (
                    Number.isInteger(limiteProdutos) &&
                    limiteProdutos > 0
                )
                    ? produtos.slice(0, limiteProdutos)
                    : produtos;

            if (produtos.length === 0) {
                grade.replaceChildren(
                    criarElemento(
                        "div",
                        "produtos-estado",
                        categoriaAtual
                        ? `Ainda não existem produtos em ${categoriaAtual.nome}.`
                        : "Nenhum produto está disponível no momento."
                    )
                );
                return;
            }

                    grade.replaceChildren(
            ...produtosExibidos.map(criarCard)
            );
            estado.ultimaAtualizacao = Date.now();
        } catch (erro) {
            if (mostrarEstado || !grade.children.length) {
                mostrarErro(erro.message);
            }
        } finally {
            estado.carregando = false;
        }
    }

    const paginaProdutos = document.querySelector(
    ".pagina-produtos"
);

const tituloPagina = paginaProdutos?.querySelector(
    "h1"
);

const introducao = paginaProdutos?.querySelector(
    ".container > p"
);

if (paginaProdutos) {
    if (categoriaAtual) {
        if (tituloPagina) {
            tituloPagina.textContent =
                categoriaAtual.titulo;
        }

        if (introducao) {
            introducao.textContent =
                `Confira os produtos disponíveis em ${categoriaAtual.nome}.`;
        }

        document.title =
            `${categoriaAtual.nome} | Vya`;
    } else {
        if (tituloPagina) {
            tituloPagina.textContent =
                "Produtos Vya";
        }

        if (introducao) {
            introducao.textContent =
                "Escolha seu produto e a variação desejada. Preços e estoque são atualizados diretamente pelo painel da VYA.";
        }

        document.title = "Produtos | Vya";
    }
}

    canalCatalogo?.addEventListener("message", (evento) => {
        if (evento.data?.tipo === "catalogo-atualizado") {
            carregar(false);
        }
    });

    window.addEventListener("storage", (evento) => {
        if (evento.key === CHAVE_CATALOGO_ATUALIZADO) {
            carregar(false);
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (
            document.visibilityState === "visible" &&
            Date.now() - estado.ultimaAtualizacao > 1000
        ) {
            carregar(false);
        }
    });

    window.addEventListener("pageshow", (evento) => {
        if (evento.persisted) {
            carregar(false);
        }
    });

    carregar(true);
})();
