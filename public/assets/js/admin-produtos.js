(() => {
    "use strict";

    const URL_API =
        "http://localhost:3000/api/admin/produtos";

    const moeda = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    const elementos = {
        carregamento: document.querySelector("#prod-admin-carregamento"),
        erro: document.querySelector("#prod-admin-erro"),
        erroTitulo: document.querySelector("#prod-admin-erro-titulo"),
        erroTexto: document.querySelector("#prod-admin-erro-texto"),
        conteudo: document.querySelector("#prod-admin-conteudo"),
        lista: document.querySelector("#prod-admin-lista"),
        vazio: document.querySelector("#prod-admin-vazio"),
        mensagem: document.querySelector("#prod-admin-mensagem"),
        busca: document.querySelector("#prod-admin-busca"),
        filtroAtivo: document.querySelector("#prod-admin-filtro-ativo"),
        totalProdutos: document.querySelector("#prod-admin-total-produtos"),
        produtosAtivos: document.querySelector("#prod-admin-produtos-ativos"),
        totalVariantes: document.querySelector("#prod-admin-total-variantes"),
        totalEstoque: document.querySelector("#prod-admin-total-estoque"),
        atualizar: document.querySelector("#prod-admin-atualizar"),
        novo: document.querySelector("#prod-admin-novo"),
        tentar: document.querySelector("#prod-admin-tentar"),
        modalProduto: document.querySelector("#modal-produto"),
        tituloProduto: document.querySelector("#modal-produto-titulo"),
        formProduto: document.querySelector("#form-produto"),
        mensagemProduto: document.querySelector("#form-produto-mensagem"),
        varianteInicial: document.querySelector("#produto-variante-inicial"),
        modalVariante: document.querySelector("#modal-variante"),
        tituloVariante: document.querySelector("#modal-variante-titulo"),
        nomeProdutoVariante: document.querySelector("#modal-variante-produto"),
        formVariante: document.querySelector("#form-variante"),
        mensagemVariante: document.querySelector("#form-variante-mensagem")
    };

    const estado = {
        produtos: [],
        carregando: false
    };

    async function chamarApi(caminho = "", opcoes = {}) {
        const resposta = await fetch(`${URL_API}${caminho}`, {
            ...opcoes,
            credentials: "include",
            headers: {
                Accept: "application/json",
                ...(opcoes.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(opcoes.headers ?? {})
            }
        });

        let resultado = null;

        try {
            resultado = await resposta.json();
        } catch {
            resultado = null;
        }

        if (!resposta.ok) {
            const detalhes = resultado?.errors
                ? Object.values(resultado.errors)
                    .flat()
                    .find(Boolean)
                : null;

            const erro = new Error(
                detalhes || resultado?.message ||
                "Não foi possível concluir a operação."
            );
            erro.status = resposta.status;
            throw erro;
        }

        return resultado;
    }

    function mostrarMensagem(texto, tipo = "") {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.dataset.tipo = tipo;
    }

    function criarStatus(ativo) {
        const elemento = document.createElement("span");
        elemento.className = ativo
            ? "prod-admin-status prod-admin-status--ativo"
            : "prod-admin-status prod-admin-status--inativo";
        elemento.textContent = ativo ? "Ativo" : "Inativo";
        return elemento;
    }

    function abrirModal(modal) {
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("prod-admin-modal-aberto");
    }

    function fecharModal(modal) {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");

        if (
            elementos.modalProduto.hidden &&
            elementos.modalVariante.hidden
        ) {
            document.body.classList.remove("prod-admin-modal-aberto");
        }
    }

    function campo(id) {
        return document.querySelector(id);
    }

    function abrirNovoProduto() {
        elementos.formProduto.reset();
        campo("#produto-id").value = "";
        campo("#produto-ativo").checked = true;
        campo("#produto-tamanho").value = "Único";
        campo("#produto-cor").value = "Padrão";
        elementos.varianteInicial.hidden = false;
        elementos.tituloProduto.textContent = "Novo produto";
        elementos.mensagemProduto.textContent = "";
        abrirModal(elementos.modalProduto);
        campo("#produto-nome").focus();
    }

    function abrirEdicaoProduto(produto) {
        elementos.formProduto.reset();
        campo("#produto-id").value = produto.id;
        campo("#produto-nome").value = produto.nome;
        campo("#produto-categoria").value = produto.categoria;
        campo("#produto-descricao").value = produto.descricao ?? "";
        campo("#produto-ativo").checked = produto.ativo;
        elementos.varianteInicial.hidden = true;
        elementos.tituloProduto.textContent = "Editar produto";
        elementos.mensagemProduto.textContent = "";
        abrirModal(elementos.modalProduto);
        campo("#produto-nome").focus();
    }

    function abrirNovaVariante(produto) {
        elementos.formVariante.reset();
        campo("#variante-produto-id").value = produto.id;
        campo("#variante-id").value = "";
        campo("#variante-tamanho").value = "Único";
        campo("#variante-cor").value = "Padrão";
        campo("#variante-ativo").checked = true;
        elementos.tituloVariante.textContent = "Nova variação";
        elementos.nomeProdutoVariante.textContent = produto.nome;
        elementos.mensagemVariante.textContent = "";
        abrirModal(elementos.modalVariante);
        campo("#variante-sku").focus();
    }

    function abrirEdicaoVariante(produto, variante) {
        elementos.formVariante.reset();
        campo("#variante-produto-id").value = produto.id;
        campo("#variante-id").value = variante.id;
        campo("#variante-sku").value = variante.sku;
        campo("#variante-tamanho").value = variante.tamanho;
        campo("#variante-cor").value = variante.cor;
        campo("#variante-preco").value = variante.preco;
        campo("#variante-estoque").value = variante.estoque;
        campo("#variante-imagem").value = variante.imagemUrl ?? "";
        campo("#variante-ativo").checked = variante.ativo;
        elementos.tituloVariante.textContent = "Editar variação";
        elementos.nomeProdutoVariante.textContent = produto.nome;
        elementos.mensagemVariante.textContent = "";
        abrirModal(elementos.modalVariante);
        campo("#variante-sku").focus();
    }

    async function salvarProduto(evento) {
        evento.preventDefault();

        const produtoId = campo("#produto-id").value;
        const botao = campo("#produto-salvar");
        const dados = {
            nome: campo("#produto-nome").value,
            categoria: campo("#produto-categoria").value,
            descricao: campo("#produto-descricao").value || null,
            ativo: campo("#produto-ativo").checked
        };

        if (!produtoId) {
            const precoTexto = campo("#produto-preco").value;
            const estoqueTexto = campo("#produto-estoque").value;
            const preco = Number(precoTexto);
            const estoque = Number(estoqueTexto);

            if (
                !campo("#produto-sku").value.trim() ||
                !campo("#produto-tamanho").value.trim() ||
                !campo("#produto-cor").value.trim() ||
                !precoTexto || !estoqueTexto ||
                !Number.isFinite(preco) || preco <= 0 ||
                !Number.isInteger(estoque) || estoque < 0
            ) {
                elementos.mensagemProduto.textContent =
                    "Preencha corretamente todos os campos da primeira variação.";
                return;
            }

            dados.varianteInicial = {
                sku: campo("#produto-sku").value,
                tamanho: campo("#produto-tamanho").value,
                cor: campo("#produto-cor").value,
                preco,
                estoque,
                imagemUrl: campo("#produto-imagem").value || null,
                ativo: true
            };
        }

        botao.disabled = true;
        elementos.mensagemProduto.textContent = "Salvando...";

        try {
            await chamarApi(
                produtoId ? `/${encodeURIComponent(produtoId)}` : "",
                {
                    method: produtoId ? "PATCH" : "POST",
                    body: JSON.stringify(dados)
                }
            );

            fecharModal(elementos.modalProduto);
            await carregarProdutos(false);
            mostrarMensagem(
                produtoId
                    ? "Produto atualizado com sucesso."
                    : "Produto cadastrado com sucesso.",
                "sucesso"
            );
        } catch (erro) {
            elementos.mensagemProduto.textContent = erro.message;
        } finally {
            botao.disabled = false;
        }
    }

    async function salvarVariante(evento) {
        evento.preventDefault();

        const produtoId = campo("#variante-produto-id").value;
        const varianteId = campo("#variante-id").value;
        const botao = campo("#variante-salvar");
        const precoTexto = campo("#variante-preco").value;
        const estoqueTexto = campo("#variante-estoque").value;
        const preco = Number(precoTexto);
        const estoque = Number(estoqueTexto);

        if (
            !precoTexto || !estoqueTexto ||
            !Number.isFinite(preco) || preco <= 0 ||
            !Number.isInteger(estoque) || estoque < 0
        ) {
            elementos.mensagemVariante.textContent =
                "Informe um preço válido e um estoque inteiro igual ou maior que zero.";
            return;
        }

        const dados = {
            sku: campo("#variante-sku").value,
            tamanho: campo("#variante-tamanho").value,
            cor: campo("#variante-cor").value,
            preco,
            estoque,
            imagemUrl: campo("#variante-imagem").value || null,
            ativo: campo("#variante-ativo").checked
        };

        botao.disabled = true;
        elementos.mensagemVariante.textContent = "Salvando...";

        try {
            const caminhoBase =
                `/${encodeURIComponent(produtoId)}/variantes`;
            const caminho = varianteId
                ? `${caminhoBase}/${encodeURIComponent(varianteId)}`
                : caminhoBase;

            await chamarApi(caminho, {
                method: varianteId ? "PATCH" : "POST",
                body: JSON.stringify(dados)
            });

            fecharModal(elementos.modalVariante);
            await carregarProdutos(false);
            mostrarMensagem(
                varianteId
                    ? "Variação atualizada com sucesso."
                    : "Variação cadastrada com sucesso.",
                "sucesso"
            );
        } catch (erro) {
            elementos.mensagemVariante.textContent = erro.message;
        } finally {
            botao.disabled = false;
        }
    }

    function criarImagem(produto) {
        const area = document.createElement("div");
        area.className = "prod-admin-produto__imagem";

        const imagemUrl = produto.variantes.find(
            (variante) => variante.imagemUrl
        )?.imagemUrl;

        if (!imagemUrl) {
            area.textContent = "VYA";
            return area;
        }

        const imagem = document.createElement("img");
        imagem.src = imagemUrl;
        imagem.alt = produto.nome;
        imagem.addEventListener("error", () => {
            area.replaceChildren();
            area.textContent = "Imagem indisponível";
        });
        area.appendChild(imagem);
        return area;
    }

    function criarVariante(produto, variante) {
        const linha = document.createElement("div");
        linha.className = "prod-admin-variante";

        const identificacao = document.createElement("div");
        const sku = document.createElement("strong");
        sku.textContent = variante.sku;
        const detalhes = document.createElement("span");
        detalhes.textContent = `${variante.tamanho} • ${variante.cor}`;
        identificacao.append(sku, detalhes);

        const preco = document.createElement("strong");
        preco.textContent = moeda.format(variante.preco);

        const estoque = document.createElement("span");
        estoque.className = variante.estoque <= 3
            ? "prod-admin-estoque prod-admin-estoque--baixo"
            : "prod-admin-estoque";
        estoque.textContent = `${variante.estoque} em estoque`;

        const status = criarStatus(variante.ativo);

        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "prod-admin-botao prod-admin-botao--pequeno";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => {
            abrirEdicaoVariante(produto, variante);
        });

        linha.append(identificacao, preco, estoque, status, editar);
        return linha;
    }

    function criarCartao(produto) {
        const cartao = document.createElement("article");
        cartao.className = "prod-admin-produto";

        const resumo = document.createElement("div");
        resumo.className = "prod-admin-produto__resumo";
        const imagem = criarImagem(produto);

        const texto = document.createElement("div");
        texto.className = "prod-admin-produto__texto";
        const categoria = document.createElement("span");
        categoria.textContent = produto.categoria;
        const nome = document.createElement("h2");
        nome.textContent = produto.nome;
        const descricao = document.createElement("p");
        descricao.textContent = produto.descricao || "Sem descrição cadastrada.";
        texto.append(categoria, nome, descricao);

        const numeros = document.createElement("div");
        numeros.className = "prod-admin-produto__numeros";
        const variacoes = document.createElement("strong");
        variacoes.textContent = `${produto.variantes.length} variação(ões)`;
        const estoque = document.createElement("span");
        estoque.textContent = `${produto.estoqueTotal} unidades`;
        numeros.append(variacoes, estoque, criarStatus(produto.ativo));

        const acoes = document.createElement("div");
        acoes.className = "prod-admin-produto__acoes";
        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "prod-admin-botao prod-admin-botao--secundario";
        editar.textContent = "Editar produto";
        editar.addEventListener("click", () => abrirEdicaoProduto(produto));
        const adicionar = document.createElement("button");
        adicionar.type = "button";
        adicionar.className = "prod-admin-botao prod-admin-botao--principal";
        adicionar.textContent = "Nova variação";
        adicionar.addEventListener("click", () => abrirNovaVariante(produto));
        acoes.append(editar, adicionar);

        resumo.append(imagem, texto, numeros, acoes);

        const variantes = document.createElement("div");
        variantes.className = "prod-admin-variantes";
        produto.variantes.forEach((variante) => {
            variantes.appendChild(criarVariante(produto, variante));
        });

        cartao.append(resumo, variantes);
        return cartao;
    }

    function atualizarIndicadores() {
        const produtos = estado.produtos;
        elementos.totalProdutos.textContent = String(produtos.length);
        elementos.produtosAtivos.textContent = String(
            produtos.filter((produto) => produto.ativo).length
        );
        elementos.totalVariantes.textContent = String(
            produtos.reduce(
                (total, produto) => total + produto.variantes.length,
                0
            )
        );
        elementos.totalEstoque.textContent = String(
            produtos.reduce(
                (total, produto) => total + produto.estoqueTotal,
                0
            )
        );
    }

    function renderizar() {
        const busca = elementos.busca.value
            .trim()
            .toLocaleLowerCase("pt-BR");
        const filtro = elementos.filtroAtivo.value;

        const produtos = estado.produtos.filter((produto) => {
            const correspondeAtivo = !filtro ||
                (filtro === "ativo" && produto.ativo) ||
                (filtro === "inativo" && !produto.ativo);

            const texto = [
                produto.nome,
                produto.categoria,
                ...produto.variantes.map((variante) => variante.sku)
            ].join(" ").toLocaleLowerCase("pt-BR");

            return correspondeAtivo &&
                (!busca || texto.includes(busca));
        });

        elementos.lista.replaceChildren();
        produtos.forEach((produto) => {
            elementos.lista.appendChild(criarCartao(produto));
        });
        elementos.vazio.hidden = produtos.length > 0;
    }

    function mostrarErro(erro) {
        elementos.carregamento.hidden = true;
        elementos.conteudo.hidden = true;
        elementos.erro.hidden = false;

        if (erro.status === 403) {
            elementos.erroTitulo.textContent = "Acesso restrito";
            elementos.erroTexto.textContent =
                "Entre com uma conta administradora para gerenciar produtos.";
            return;
        }

        elementos.erroTitulo.textContent = "Não foi possível abrir o catálogo";
        elementos.erroTexto.textContent = erro.message;
    }

    async function carregarProdutos(mostrarCarregamento = true) {
        if (estado.carregando) {
            return;
        }

        estado.carregando = true;
        elementos.atualizar.disabled = true;
        elementos.erro.hidden = true;

        if (mostrarCarregamento) {
            elementos.carregamento.hidden = false;
            elementos.conteudo.hidden = true;
        }

        try {
            const resultado = await chamarApi();
            estado.produtos = resultado.data.produtos;
            atualizarIndicadores();
            renderizar();
            elementos.carregamento.hidden = true;
            elementos.conteudo.hidden = false;
        } catch (erro) {
            mostrarErro(erro);
        } finally {
            estado.carregando = false;
            elementos.atualizar.disabled = false;
        }
    }

    elementos.novo.addEventListener("click", abrirNovoProduto);
    elementos.atualizar.addEventListener("click", () => carregarProdutos(true));
    elementos.tentar.addEventListener("click", () => carregarProdutos(true));
    elementos.busca.addEventListener("input", renderizar);
    elementos.filtroAtivo.addEventListener("change", renderizar);
    elementos.formProduto.addEventListener("submit", salvarProduto);
    elementos.formVariante.addEventListener("submit", salvarVariante);

    document.querySelectorAll("[data-fechar-modal-produto]")
        .forEach((elemento) => elemento.addEventListener(
            "click",
            () => fecharModal(elementos.modalProduto)
        ));

    document.querySelectorAll("[data-fechar-modal-variante]")
        .forEach((elemento) => elemento.addEventListener(
            "click",
            () => fecharModal(elementos.modalVariante)
        ));

    document.addEventListener("keydown", (evento) => {
        if (evento.key !== "Escape") {
            return;
        }

        if (!elementos.modalProduto.hidden) {
            fecharModal(elementos.modalProduto);
        }

        if (!elementos.modalVariante.hidden) {
            fecharModal(elementos.modalVariante);
        }
    });

    carregarProdutos(true);
})();
