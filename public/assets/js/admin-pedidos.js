(() => {
    "use strict";

    const URL_API =
        "http://localhost:3000/api/admin/pedidos";

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

    const ROTULOS = {
        aguardando_pagamento: "Aguardando pagamento",
        pago: "Pago",
        em_preparacao: "Em preparação",
        pronto_para_retirada: "Pronto para retirada",
        pronto_para_envio: "Pronto para envio",
        em_transporte: "Em transporte",
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
        entregue: "Entregue",
        cancelada: "Cancelada",
        retirada: "Retirada gratuita",
        entrega_propria: "Entrega própria"
    };

    const elementos = {
        carregamento: document.querySelector(
            "#admin-carregamento"
        ),
        erro: document.querySelector("#admin-erro"),
        erroTitulo: document.querySelector(
            "#admin-erro-titulo"
        ),
        erroTexto: document.querySelector(
            "#admin-erro-texto"
        ),
        conteudo: document.querySelector(
            "#admin-conteudo"
        ),
        lista: document.querySelector("#admin-lista"),
        vazio: document.querySelector("#admin-vazio"),
        retorno: document.querySelector("#admin-retorno"),
        busca: document.querySelector("#admin-busca"),
        filtroStatus: document.querySelector(
            "#admin-filtro-status"
        ),
        total: document.querySelector("#admin-total"),
        pendentes: document.querySelector(
            "#admin-pendentes"
        ),
        andamento: document.querySelector(
            "#admin-andamento"
        ),
        concluidos: document.querySelector(
            "#admin-concluidos"
        ),
        atualizar: document.querySelector(
            "#admin-atualizar"
        ),
        tentarNovamente: document.querySelector(
            "#admin-tentar-novamente"
        )
    };

    const estado = {
        pedidos: [],
        carregando: false
    };

    function rotulo(valor) {
        if (!valor) {
            return "Não informado";
        }

        return ROTULOS[valor] ||
            valor.replaceAll("_", " ");
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

    function classeStatus(status) {
        if (status?.includes("cancel")) {
            return "admin-status--cancelado";
        }

        if (["concluido", "entregue"].includes(status)) {
            return "admin-status--sucesso";
        }

        if (
            [
                "pago",
                "em_preparacao",
                "pronto_para_retirada",
                "pronto_para_envio",
                "em_transporte"
            ].includes(status)
        ) {
            return "admin-status--informacao";
        }

        return "admin-status--pendente";
    }

    async function chamarApi(
        caminho = "",
        opcoes = {}
    ) {
        const resposta = await fetch(
            `${URL_API}${caminho}`,
            {
                ...opcoes,
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    ...(opcoes.body
                        ? {
                            "Content-Type":
                                "application/json"
                        }
                        : {}),
                    ...(opcoes.headers ?? {})
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
                "Não foi possível concluir a operação."
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
            `admin-status ${classeStatus(status)}`;
        elemento.textContent = rotulo(status);
        return elemento;
    }

    function criarDado(titulo, valor) {
        const dado = document.createElement("div");
        dado.className = "admin-dado";

        const rotuloElemento =
            document.createElement("span");
        rotuloElemento.textContent = titulo;

        const valorElemento =
            document.createElement("strong");
        valorElemento.textContent = valor;

        dado.append(rotuloElemento, valorElemento);
        return dado;
    }

    function criarItem(item) {
        const linha = document.createElement("div");
        linha.className = "admin-item";

        const descricao = document.createElement("div");
        const nome = document.createElement("strong");
        nome.textContent =
            `${item.quantidade}× ${item.nome}`;

        const variante = document.createElement("span");
        variante.textContent =
            `${item.sku} • ${item.tamanho} • ${item.cor}`;

        descricao.append(nome, variante);

        const subtotal = document.createElement("strong");
        subtotal.textContent = moeda.format(item.subtotal);

        linha.append(descricao, subtotal);
        return linha;
    }

    function descricaoEndereco(pedido) {
        if (!pedido.endereco) {
            return "Retirada no local";
        }

        const endereco = pedido.endereco;
        const complemento = endereco.complemento
            ? `, ${endereco.complemento}`
            : "";

        return [
            endereco.destinatario,
            `${endereco.logradouro}, ${endereco.numero}${complemento}`,
            `${endereco.bairro} — ${endereco.cidade}/${endereco.estado}`,
            `CEP ${endereco.cep}`
        ].filter(Boolean).join(" • ");
    }

    function rotuloAcao(acao, pedido) {
        const rotulos = {
            confirmar_pagamento: "Confirmar pagamento",
            iniciar_preparacao: "Iniciar preparação",
            iniciar_entrega: "Saiu para entrega",
            cancelar: "Cancelar pedido"
        };

        if (acao === "marcar_pronto") {
            return pedido.metodoEntrega === "retirada"
                ? "Pronto para retirada"
                : "Pronto para envio";
        }

        if (acao === "concluir") {
            return pedido.metodoEntrega === "retirada"
                ? "Confirmar retirada"
                : "Confirmar entrega";
        }

        return rotulos[acao] || acao;
    }

    async function executarAcao(
        pedido,
        acao,
        botao
    ) {
        if (
            acao === "cancelar" &&
            !window.confirm(
                "Deseja cancelar este pedido? O estoque será devolvido automaticamente."
            )
        ) {
            return;
        }

        botao.disabled = true;
        elementos.retorno.textContent =
            "Atualizando o pedido...";
        elementos.retorno.dataset.tipo = "";

        try {
            await chamarApi(
                `/${encodeURIComponent(pedido.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ acao })
                }
            );

            await carregarPedidos(false);
            elementos.retorno.textContent =
                `Pedido #${pedido.numeroPedido} atualizado com sucesso.`;
            elementos.retorno.dataset.tipo = "sucesso";
        } catch (erro) {
            elementos.retorno.textContent = erro.message;
            elementos.retorno.dataset.tipo = "erro";
            botao.disabled = false;
        }
    }

    function preencherDetalhes(
        area,
        pedido
    ) {
        area.replaceChildren();

        const grade = document.createElement("div");
        grade.className = "admin-detalhes__grade";
        grade.append(
            criarDado(
                "Pagamento",
                `${rotulo(pedido.statusPagamento)} • Preferência: ${rotulo(pedido.metodoPagamento)}`
            ),
            criarDado(
                "Recebimento",
                rotulo(pedido.metodoEntrega)
            ),
            criarDado(
                "Situação da entrega",
                rotulo(pedido.statusEntrega)
            ),
            criarDado(
                "Endereço",
                descricaoEndereco(pedido)
            )
        );

        const tituloItens = document.createElement("h3");
        tituloItens.textContent = "Produtos";

        const itens = document.createElement("div");
        itens.className = "admin-itens";
        pedido.itens.forEach((item) => {
            itens.appendChild(criarItem(item));
        });

        const acoes = document.createElement("div");
        acoes.className = "admin-acoes";

        pedido.acoesDisponiveis.forEach((acao) => {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = acao === "cancelar"
                ? "admin-botao admin-botao--perigo"
                : "admin-botao admin-botao--principal";
            botao.textContent = rotuloAcao(acao, pedido);
            botao.addEventListener("click", () => {
                executarAcao(pedido, acao, botao);
            });
            acoes.appendChild(botao);
        });

        if (pedido.acoesDisponiveis.length === 0) {
            const finalizado = document.createElement("p");
            finalizado.className = "admin-finalizado";
            finalizado.textContent =
                "Este pedido não possui mais ações pendentes.";
            acoes.appendChild(finalizado);
        }

        area.append(grade, tituloItens, itens, acoes);
        area.dataset.carregado = "true";
    }

    async function alternarDetalhes(
        pedido,
        area,
        botao
    ) {
        if (!area.hidden) {
            area.hidden = true;
            botao.textContent = "Gerenciar";
            botao.setAttribute("aria-expanded", "false");
            return;
        }

        area.hidden = false;
        botao.textContent = "Fechar detalhes";
        botao.setAttribute("aria-expanded", "true");

        if (area.dataset.carregado === "true") {
            return;
        }

        area.textContent = "Carregando detalhes...";
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
            area.textContent = erro.message;
            area.classList.add("admin-detalhes--erro");
        } finally {
            botao.disabled = false;
        }
    }

    function criarCartao(pedido) {
        const cartao = document.createElement("article");
        cartao.className = "admin-pedido";

        const cabecalho = document.createElement("header");
        cabecalho.className = "admin-pedido__cabecalho";

        const identificacao = document.createElement("div");
        const numero = document.createElement("h2");
        numero.textContent = `Pedido #${pedido.numeroPedido}`;
        const data = document.createElement("p");
        data.textContent = `Pedido criado em ${formatarData(pedido.criadoEm)}`;
        identificacao.append(numero, data);

        const total = document.createElement("strong");
        total.className = "admin-pedido__total";
        total.textContent = moeda.format(pedido.total);

        cabecalho.append(
            identificacao,
            criarStatus(pedido.status),
            total
        );

        const resumo = document.createElement("div");
        resumo.className = "admin-pedido__resumo";
        resumo.append(
            criarDado("Cliente", pedido.cliente.nome),
            criarDado("E-mail", pedido.cliente.email),
            criarDado(
                "Itens",
                String(pedido.quantidadeItens)
            )
        );

        const gerenciar = document.createElement("button");
        gerenciar.type = "button";
        gerenciar.className =
            "admin-botao admin-botao--secundario";
        gerenciar.textContent = "Gerenciar";
        gerenciar.setAttribute("aria-expanded", "false");

        const detalhes = document.createElement("section");
        detalhes.className = "admin-detalhes";
        detalhes.hidden = true;

        gerenciar.addEventListener("click", () => {
            alternarDetalhes(
                pedido,
                detalhes,
                gerenciar
            );
        });

        resumo.appendChild(gerenciar);
        cartao.append(cabecalho, resumo, detalhes);
        return cartao;
    }

    function atualizarIndicadores() {
        const pedidos = estado.pedidos;
        elementos.total.textContent = String(pedidos.length);
        elementos.pendentes.textContent = String(
            pedidos.filter((pedido) => {
                return pedido.statusPagamento === "pendente" &&
                    pedido.status !== "cancelado";
            }).length
        );
        elementos.andamento.textContent = String(
            pedidos.filter((pedido) => {
                return ![
                    "aguardando_pagamento",
                    "concluido",
                    "cancelado"
                ].includes(pedido.status);
            }).length
        );
        elementos.concluidos.textContent = String(
            pedidos.filter((pedido) => {
                return pedido.status === "concluido";
            }).length
        );
    }

    function renderizarPedidos() {
        const busca = elementos.busca.value
            .trim()
            .toLocaleLowerCase("pt-BR");
        const status = elementos.filtroStatus.value;

        const pedidos = estado.pedidos.filter((pedido) => {
            const correspondeStatus =
                !status || pedido.status === status;

            const texto = [
                pedido.numeroPedido,
                pedido.cliente.nome,
                pedido.cliente.email
            ].join(" ").toLocaleLowerCase("pt-BR");

            return correspondeStatus &&
                (!busca || texto.includes(busca));
        });

        elementos.lista.replaceChildren();
        pedidos.forEach((pedido) => {
            elementos.lista.appendChild(
                criarCartao(pedido)
            );
        });

        elementos.vazio.hidden = pedidos.length > 0;
    }

    function mostrarErro(erro) {
        elementos.carregamento.hidden = true;
        elementos.conteudo.hidden = true;
        elementos.erro.hidden = false;

        if (erro.status === 403) {
            elementos.erroTitulo.textContent =
                "Acesso restrito";
            elementos.erroTexto.textContent =
                "Sua conta está autenticada, mas ainda não possui o papel de administrador.";
            return;
        }

        if (erro.status === 401) {
            elementos.erroTitulo.textContent =
                "Faça login para continuar";
            elementos.erroTexto.textContent =
                "Entre com a conta administradora da VYA.";
            return;
        }

        elementos.erroTitulo.textContent =
            "Não foi possível abrir o painel";
        elementos.erroTexto.textContent = erro.message;
    }

    async function carregarPedidos(
        mostrarCarregamento = true
    ) {
        if (estado.carregando) {
            return;
        }

        estado.carregando = true;
        elementos.atualizar.disabled = true;

        if (mostrarCarregamento) {
            elementos.carregamento.hidden = false;
            elementos.conteudo.hidden = true;
        }

        elementos.erro.hidden = true;

        try {
            const resultado = await chamarApi();
            estado.pedidos = resultado.data.pedidos;

            atualizarIndicadores();
            renderizarPedidos();

            elementos.carregamento.hidden = true;
            elementos.conteudo.hidden = false;
        } catch (erro) {
            mostrarErro(erro);
        } finally {
            estado.carregando = false;
            elementos.atualizar.disabled = false;
        }
    }

    elementos.busca.addEventListener(
        "input",
        renderizarPedidos
    );

    elementos.filtroStatus.addEventListener(
        "change",
        renderizarPedidos
    );

    elementos.atualizar.addEventListener(
        "click",
        () => carregarPedidos(true)
    );

    elementos.tentarNovamente.addEventListener(
        "click",
        () => carregarPedidos(true)
    );

    carregarPedidos(true);
})();
