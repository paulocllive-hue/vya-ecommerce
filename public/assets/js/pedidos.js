(() => {
    "use strict";

    const URL_API =
        "http://localhost:3000/api/checkout/pedidos";

    const moeda = new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

    const FUSO_LOJA = "America/Cuiaba";
    const fusoNavegador = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const opcoesDataHora = {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23", timeZoneName: "longOffset"
    };
    const dataHora = new Intl.DateTimeFormat("pt-BR", {
        ...opcoesDataHora, timeZone: FUSO_LOJA
    });
    const dataHoraLocal = fusoNavegador !== FUSO_LOJA
        ? new Intl.DateTimeFormat("pt-BR", {
            ...opcoesDataHora, timeZone: fusoNavegador
        }) : null;

    const ROTULOS_STATUS = {
        aguardando_pagamento: "Aguardando pagamento",
        pago: "Pago",
        confirmado: "Confirmado",
        em_preparacao: "Em preparação",
        enviado: "Enviado",
        concluido: "Concluído",
        cancelado: "Cancelado",
        pix: "Pix",
        cartao_credito: "Cartão de crédito",
        cartao_debito: "Cartão de débito",
        boleto: "Boleto",
        pendente: "Pendente",
        aprovado: "Aprovado",
        recusado: "Recusado",
        reembolsado: "Reembolsado",
        aguardando_retirada: "Aguardando retirada",
        aguardando_envio: "Aguardando envio",
        em_transporte: "Em transporte",
        entregue: "Entregue",
        cancelada: "Cancelada",
        retirada: "Retirada gratuita",
        entrega_propria: "Entrega própria"
    };

    const elementos = {
        carregamento: document.querySelector(
            "#pedidos-carregamento"
        ),
        erro: document.querySelector(
            "#pedidos-erro"
        ),
        erroTitulo: document.querySelector(
            "#pedidos-erro-titulo"
        ),
        erroTexto: document.querySelector(
            "#pedidos-erro-texto"
        ),
        entrar: document.querySelector(
            "#pedidos-entrar"
        ),
        tentarNovamente: document.querySelector(
            "#pedidos-tentar-novamente"
        ),
        vazio: document.querySelector(
            "#pedidos-vazio"
        ),
        conteudo: document.querySelector(
            "#pedidos-conteudo"
        ),
        quantidade: document.querySelector(
            "#pedidos-quantidade"
        ),
        lista: document.querySelector(
            "#pedidos-lista"
        )
    };

    const estado = {
        carregando: false,
        carregado: false
    };

    function rotulo(valor) {
        if (!valor) {
            return "Não informado";
        }

        return ROTULOS_STATUS[valor] ||
            valor
                .replaceAll("_", " ")
                .replace(/^./, (letra) => {
                    return letra.toUpperCase();
                });
    }

    function classeStatus(status) {
        if (
            status?.includes("cancel") ||
            status === "recusado"
        ) {
            return "pedido-status--cancelado";
        }

        if (
            [
                "pago",
                "aprovado",
                "concluido",
                "entregue"
            ].includes(status)
        ) {
            return "pedido-status--sucesso";
        }

        if (
            [
                "confirmado",
                "em_preparacao",
                "enviado",
                "em_transporte"
            ].includes(status)
        ) {
            return "pedido-status--informacao";
        }

        return "pedido-status--pendente";
    }

    function formatarData(valor) {
        if (!valor) return "Data não informada";
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "Data não informada";
        const horarioLoja = dataHora.format(data) + " (" + FUSO_LOJA + ")";
        return dataHoraLocal
            ? horarioLoja + " • Seu horário: " + dataHoraLocal.format(data) +
                " (" + fusoNavegador + ")"
            : horarioLoja;
    }

    async function chamarApi(caminho = "") {
        const resposta = await fetch(
            `${URL_API}${caminho}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
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
                resultado?.message ||
                "Não foi possível consultar seus pedidos."
            );

            erro.status = resposta.status;
            erro.codigo = resultado?.code;
            throw erro;
        }

        return resultado;
    }

    function criarStatus(status) {
        const elemento = document.createElement("span");
        elemento.className =
            `pedido-status ${classeStatus(status)}`;
        elemento.textContent = rotulo(status);
        return elemento;
    }

    function criarInformacao(rotuloTexto, conteudo) {
        const elemento = document.createElement("div");
        elemento.className = "pedido-informacao";

        const titulo = document.createElement("span");
        titulo.className = "pedido-informacao__rotulo";
        titulo.textContent = rotuloTexto;

        const valor = document.createElement("strong");

        if (conteudo instanceof Node) {
            valor.appendChild(conteudo);
        } else {
            valor.textContent = conteudo;
        }

        elemento.append(titulo, valor);
        return elemento;
    }

    function criarItemPedido(item) {
        const elemento = document.createElement("article");
        elemento.className = "pedido-item";

        const quantidade = document.createElement("span");
        quantidade.className = "pedido-item__quantidade";
        quantidade.textContent = `${item.quantidade}×`;

        const descricao = document.createElement("div");
        descricao.className = "pedido-item__descricao";

        const nome = document.createElement("strong");
        nome.textContent = item.nome;

        const variante = document.createElement("span");
        variante.textContent =
            `${item.sku} • ${item.tamanho} • ${item.cor}`;

        descricao.append(nome, variante);

        const preco = document.createElement("strong");
        preco.className = "pedido-item__preco";
        preco.textContent = moeda.format(
            Number(item.subtotal)
        );

        elemento.append(
            quantidade,
            descricao,
            preco
        );

        return elemento;
    }

    function preencherDetalhes(area, pedido) {
        area.replaceChildren();

        const titulo = document.createElement("h3");
        titulo.className = "pedido-detalhes__titulo";
        titulo.textContent = "Produtos do pedido";

        const lista = document.createElement("div");
        lista.className = "pedido-detalhes__lista";

        pedido.itens.forEach((item) => {
            lista.appendChild(criarItemPedido(item));
        });

        area.append(titulo, lista);
        area.dataset.carregado = "true";
    }

    async function alternarDetalhes(
        pedido,
        area,
        botao
    ) {
        if (!area.hidden) {
            area.hidden = true;
            botao.textContent = "Ver detalhes";
            botao.setAttribute("aria-expanded", "false");
            return;
        }

        area.hidden = false;
        botao.textContent = "Ocultar detalhes";
        botao.setAttribute("aria-expanded", "true");

        if (area.dataset.carregado === "true") {
            return;
        }

        area.innerHTML = `
            <p class="pedido-detalhes__mensagem">
                Carregando os produtos...
            </p>
        `;

        botao.disabled = true;

        try {
            const resultado = await chamarApi(
                `/${encodeURIComponent(pedido.id)}`
            );

            preencherDetalhes(
                area,
                resultado.data.pedido
            );
        } catch (erro) {
            area.innerHTML = "";

            const mensagem = document.createElement("p");
            mensagem.className =
                "pedido-detalhes__mensagem " +
                "pedido-detalhes__mensagem--erro";
            mensagem.textContent = erro.message;
            area.appendChild(mensagem);
        } finally {
            botao.disabled = false;
        }
    }

    function criarCartaoPedido(pedido) {
        const cartao = document.createElement("article");
        cartao.className = "pedido-cartao";

        const cabecalho = document.createElement("header");
        cabecalho.className = "pedido-cartao__cabecalho";

        const identificacao = document.createElement("div");

        const numero = document.createElement("h2");
        numero.className = "pedido-cartao__numero";
        numero.textContent =
            `Pedido #${pedido.numeroPedido}`;

        const data = document.createElement("p");
        data.className = "pedido-cartao__data";
        data.textContent =
            `Pedido criado em ${formatarData(pedido.criadoEm)}`;

        identificacao.append(numero, data);

        const total = document.createElement("div");
        total.className = "pedido-cartao__total";

        const totalRotulo = document.createElement("span");
        totalRotulo.textContent = "Total";

        const totalValor = document.createElement("strong");
        totalValor.textContent = moeda.format(
            Number(pedido.total)
        );

        total.append(totalRotulo, totalValor);

        cabecalho.append(
            identificacao,
            criarStatus(pedido.status),
            total
        );

        const corpo = document.createElement("div");
        corpo.className = "pedido-cartao__corpo";

        const pagamento = criarInformacao(
            "Pagamento",
            `${rotulo(pedido.statusPagamento)} • Preferência: ${rotulo(pedido.metodoPagamento)}`
        );

        const recebimento = criarInformacao(
            "Recebimento",
            rotulo(pedido.metodoEntrega)
        );

        const andamento = criarInformacao(
            pedido.metodoEntrega === "retirada"
                ? "Retirada"
                : "Entrega",
            rotulo(pedido.statusEntrega)
        );

        const detalhesId =
            `pedido-detalhes-${pedido.id}`;

        const botaoDetalhes =
            document.createElement("button");
        botaoDetalhes.type = "button";
        botaoDetalhes.className =
            "pedido-detalhes-botao";
        botaoDetalhes.textContent = "Ver detalhes";
        botaoDetalhes.setAttribute(
            "aria-expanded",
            "false"
        );
        botaoDetalhes.setAttribute(
            "aria-controls",
            detalhesId
        );

        corpo.append(
            pagamento,
            recebimento,
            andamento,
            botaoDetalhes
        );

        const detalhes = document.createElement("section");
        detalhes.className = "pedido-detalhes";
        detalhes.id = detalhesId;
        detalhes.hidden = true;

        botaoDetalhes.addEventListener(
            "click",
            () => {
                alternarDetalhes(
                    pedido,
                    detalhes,
                    botaoDetalhes
                );
            }
        );

        cartao.append(cabecalho, corpo, detalhes);
        return cartao;
    }

    function renderizarPedidos(pedidos) {
        elementos.lista.replaceChildren();

        pedidos.forEach((pedido) => {
            elementos.lista.appendChild(
                criarCartaoPedido(pedido)
            );
        });

        const quantidade = pedidos.length;
        elementos.quantidade.textContent =
            `${quantidade} ${quantidade === 1
                ? "pedido"
                : "pedidos"}`;
    }

    function mostrarErro(erro) {
        const precisaEntrar = erro.status === 401;

        elementos.erroTitulo.textContent = precisaEntrar
            ? "Entre para consultar seus pedidos"
            : "Não foi possível carregar seus pedidos";

        elementos.erroTexto.textContent = precisaEntrar
            ? "Seus pedidos ficam protegidos e vinculados à sua conta Vya."
            : erro.message;

        elementos.entrar.hidden = !precisaEntrar;
        elementos.erro.hidden = false;
    }

    async function carregarPedidos() {
        if (estado.carregando) {
            return;
        }

        estado.carregando = true;
        elementos.carregamento.hidden = false;
        elementos.erro.hidden = true;
        elementos.vazio.hidden = true;
        elementos.conteudo.hidden = true;

        try {
            const resultado = await chamarApi();
            const pedidos = resultado.data.pedidos;

            estado.carregado = true;
            elementos.carregamento.hidden = true;

            if (pedidos.length === 0) {
                elementos.vazio.hidden = false;
                return;
            }

            renderizarPedidos(pedidos);
            elementos.conteudo.hidden = false;
        } catch (erro) {
            estado.carregado = false;
            elementos.carregamento.hidden = true;
            mostrarErro(erro);
        } finally {
            estado.carregando = false;
        }
    }

    elementos.tentarNovamente.addEventListener(
        "click",
        carregarPedidos
    );

    elementos.entrar.addEventListener(
        "click",
        () => {
            document.querySelector(
                "#botao-conta"
            )?.click();
        }
    );

    window.addEventListener(
        "vya:autenticacao-alterada",
        (evento) => {
            if (
                evento.detail?.usuario &&
                !estado.carregado
            ) {
                carregarPedidos();
            }
        }
    );

    carregarPedidos();
})();
