(() => {
    "use strict";

    const URL_API_PRODUTOS =
        "http://localhost:3000/api/produtos";
    const URL_API_CARRINHO =
        "http://localhost:3000/api/carrinho/itens";

    const moeda = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    const grade = document.querySelector(".produtos");

    if (!grade) {
        return;
    }

    const estado = {
        adicionando: new Set()
    };

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

    async function lerResposta(resposta) {
        try {
            return await resposta.json();
        } catch {
            return null;
        }
    }

    async function buscarProdutos() {
        const resposta = await fetch(URL_API_PRODUTOS, {
            credentials: "include",
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

    function textoVariante(variante) {
        const detalhes = [
            variante.tamanho,
            variante.cor
        ].filter(Boolean).join(" • ");

        if (!variante.disponivel) {
            return `${detalhes} — esgotado`;
        }

        return `${detalhes} — ${moeda.format(variante.preco)}`;
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

        imagem.alt = `Foto de ${produto.nome}`;
        imagem.loading = "lazy";

        function atualizarImagem(url) {
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
            atualizarImagem
        };
    }

    function criarCard(produto) {
        let varianteAtual = varianteSelecionavel(produto);
        const card = criarElemento("article", "produto-card");
        const imagem = criarImagem(produto, varianteAtual);
        const conteudo = criarElemento("div", "produto-info");
        const categoria = criarElemento(
            "p",
            "produto-categoria",
            produto.categoria
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
            varianteAtual
                ? moeda.format(varianteAtual.preco)
                : "Indisponível"
        );
        const estoque = criarElemento("p", "produto-estoque");
        const mensagem = criarElemento(
            "p",
            "produto-mensagem"
        );
        const botao = criarElemento(
            "button",
            "botao botao--principal",
            "Adicionar ao carrinho"
        );

        botao.type = "button";

        function atualizarVariante(variante) {
            varianteAtual = variante;
            preco.textContent = variante
                ? moeda.format(variante.preco)
                : "Indisponível";
            estoque.textContent = !variante
                ? "Nenhuma variação disponível"
                : variante.disponivel
                    ? `${variante.estoque} em estoque`
                    : "Produto esgotado";
            estoque.dataset.disponivel =
                variante?.disponivel ? "true" : "false";
            botao.disabled = !variante?.disponivel;
            botao.textContent = variante?.disponivel
                ? "Adicionar ao carrinho"
                : "Esgotado";
            mensagem.textContent = "";
            imagem.atualizarImagem(variante?.imagemUrl);
        }

        conteudo.append(categoria, titulo, descricao);

        if (produto.variantes.length > 1) {
            const grupo = criarElemento(
                "label",
                "produto-variacao"
            );
            const legenda = criarElemento(
                "span",
                "",
                "Escolha a opção"
            );
            const seletor = document.createElement("select");

            seletor.setAttribute(
                "aria-label",
                `Escolha a variação de ${produto.nome}`
            );

            produto.variantes.forEach((variante) => {
                const opcao = document.createElement("option");
                opcao.value = variante.id;
                opcao.textContent = textoVariante(variante);
                opcao.disabled = !variante.disponivel;
                opcao.selected = variante.id === varianteAtual?.id;
                seletor.append(opcao);
            });

            seletor.addEventListener("change", () => {
                const escolhida = produto.variantes.find(
                    (variante) => variante.id === seletor.value
                );

                atualizarVariante(escolhida ?? null);
            });

            grupo.append(legenda, seletor);
            conteudo.append(grupo);
        } else if (varianteAtual) {
            conteudo.append(
                criarElemento(
                    "p",
                    "produto-opcao-unica",
                    [varianteAtual.tamanho, varianteAtual.cor]
                        .filter(Boolean)
                        .join(" • ")
                )
            );
        }

        botao.addEventListener("click", async () => {
            if (
                !varianteAtual?.disponivel ||
                estado.adicionando.has(varianteAtual.id)
            ) {
                return;
            }

            const varianteId = varianteAtual.id;
            estado.adicionando.add(varianteId);
            botao.disabled = true;
            botao.textContent = "Adicionando...";
            mensagem.textContent = "";

            try {
                const resultado = await adicionarAoCarrinho(varianteId);
                mensagem.textContent =
                    "Produto adicionado ao carrinho.";
                mensagem.dataset.tipo = "sucesso";

                window.CarrinhoVya?.atualizarContador?.(
                    resultado?.data?.carrinho
                );

                if (window.CarrinhoVya?.recarregar) {
                    await window.CarrinhoVya.recarregar();
                }
            } catch (erro) {
                if (erro.status === 401) {
                    document.querySelector("#botao-conta")?.click();
                }

                mensagem.textContent = erro.status === 401
                    ? "Entre na sua conta para adicionar ao carrinho."
                    : erro.message;
                mensagem.dataset.tipo = "erro";
            } finally {
                estado.adicionando.delete(varianteId);
                botao.disabled = !varianteAtual?.disponivel;
                botao.textContent = varianteAtual?.disponivel
                    ? "Adicionar ao carrinho"
                    : "Esgotado";
            }
        });

        conteudo.append(preco, estoque, botao, mensagem);
        card.append(imagem.area, conteudo);
        atualizarVariante(varianteAtual);

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

    async function carregar() {
        mostrarCarregamento();

        try {
            const produtos = await buscarProdutos();

            if (produtos.length === 0) {
                grade.replaceChildren(
                    criarElemento(
                        "div",
                        "produtos-estado",
                        "Nenhum produto está disponível no momento."
                    )
                );
                return;
            }

            grade.replaceChildren(
                ...produtos.map(criarCard)
            );
        } catch (erro) {
            mostrarErro(erro.message);
        }
    }

    const introducao = document.querySelector(
        ".pagina-produtos .container > p"
    );

    if (introducao) {
        introducao.textContent =
            "Escolha seu produto e a variação desejada. Preços e estoque são atualizados diretamente pelo painel da VYA.";
    }

    carregar();
})();
