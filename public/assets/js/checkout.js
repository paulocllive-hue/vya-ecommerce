(() => {
    "use strict";

    const URL_API = "http://localhost:3000/api";

    const moeda = new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

    const elementos = {
        carregamento: document.querySelector(
            "#checkout-carregamento"
        ),
        erroInicial: document.querySelector(
            "#checkout-erro-inicial"
        ),
        erroTitulo: document.querySelector(
            "#checkout-erro-titulo"
        ),
        erroTexto: document.querySelector(
            "#checkout-erro-texto"
        ),
        entrar: document.querySelector(
            "#checkout-entrar"
        ),
        tentarNovamente: document.querySelector(
            "#checkout-tentar-novamente"
        ),
        conteudo: document.querySelector(
            "#checkout-conteudo"
        ),
        opcaoEntrega: document.querySelector(
            "#checkout-opcao-entrega"
        ),
        radioEntrega: document.querySelector(
            "input[value='entrega_propria']"
        ),
        seloEntrega: document.querySelector(
            "#checkout-selo-entrega"
        ),
        mensagemEntrega: document.querySelector(
            "#checkout-mensagem-entrega"
        ),
        areaEnderecos: document.querySelector(
            "#checkout-area-enderecos"
        ),
        listaEnderecos: document.querySelector(
            "#checkout-lista-enderecos"
        ),
        novoEndereco: document.querySelector(
            "#checkout-novo-endereco"
        ),
        formularioEndereco: document.querySelector(
            "#checkout-formulario-endereco"
        ),
        salvarEndereco: document.querySelector(
            "#checkout-salvar-endereco"
        ),
        cancelarEndereco: document.querySelector(
            "#checkout-cancelar-endereco"
        ),
        itens: document.querySelector(
            "#checkout-itens"
        ),
        subtotal: document.querySelector(
            "#checkout-subtotal"
        ),
        frete: document.querySelector(
            "#checkout-frete"
        ),
        total: document.querySelector(
            "#checkout-total"
        ),
        mensagemFinal: document.querySelector(
            "#checkout-mensagem-final"
        ),
        finalizar: document.querySelector(
            "#checkout-finalizar"
        ),
        sucesso: document.querySelector(
            "#checkout-sucesso"
        ),
        numeroPedido: document.querySelector(
            "#checkout-numero-pedido"
        ),
        sucessoDetalhes: document.querySelector(
            "#checkout-sucesso-detalhes"
        )
    };

    const estado = {
        carrinho: null,
        opcoes: null,
        metodoEntrega: "retirada",
        enderecoId: null,
        valorFrete: 0,
        calculoEmAndamento: 0,
        carregado: false,
        carregando: false
    };

    async function chamarApi(caminho, opcoes = {}) {
        const configuracao = {
            credentials: "include",
            ...opcoes,
            headers: {
                Accept: "application/json",
                ...opcoes.headers
            }
        };

        if (configuracao.body) {
            configuracao.headers["Content-Type"] =
                "application/json";
        }

        const resposta = await fetch(
            `${URL_API}${caminho}`,
            configuracao
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
            erro.campos = resultado?.errors;

            throw erro;
        }

        return resultado;
    }

    function definirMensagem(
        elemento,
        texto = "",
        tipo = ""
    ) {
        elemento.textContent = texto;

        if (tipo) {
            elemento.dataset.tipo = tipo;
        } else {
            delete elemento.dataset.tipo;
        }
    }

    function mostrarErroInicial(erro) {
        elementos.carregamento.hidden = true;
        elementos.conteudo.hidden = true;
        elementos.erroInicial.hidden = false;

        const precisaEntrar = erro?.status === 401;

        elementos.erroTitulo.textContent = precisaEntrar
            ? "Entre para finalizar sua compra"
            : "Não foi possível abrir o checkout";

        elementos.erroTexto.textContent = precisaEntrar
            ? "O checkout utiliza sua conta para proteger o carrinho e registrar o pedido."
            : erro?.message ||
                "Verifique se o backend está funcionando e tente novamente.";

        elementos.entrar.hidden = !precisaEntrar;
    }

    function criarItemResumo(item) {
        const elemento = document.createElement("article");
        elemento.className = "checkout-item";

        const quantidade = document.createElement("span");
        quantidade.className = "checkout-item__quantidade";
        quantidade.textContent = `${item.quantidade}×`;

        const descricao = document.createElement("div");
        descricao.className = "checkout-item__descricao";

        const nome = document.createElement("strong");
        nome.textContent = item.nome;

        const variante = document.createElement("span");
        variante.textContent =
            `${item.tamanho} • ${item.cor}`;

        descricao.append(nome, variante);

        const preco = document.createElement("strong");
        preco.className = "checkout-item__preco";
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

    function renderizarItens() {
        elementos.itens.replaceChildren();

        estado.carrinho.itens.forEach((item) => {
            elementos.itens.appendChild(
                criarItemResumo(item)
            );
        });
    }

    function atualizarValores() {
        const subtotal = Number(
            estado.carrinho?.total || 0
        );

        const frete = Number(
            estado.valorFrete || 0
        );

        elementos.subtotal.textContent =
            moeda.format(subtotal);

        elementos.frete.textContent = frete > 0
            ? moeda.format(frete)
            : "Grátis";

        elementos.total.textContent =
            moeda.format(subtotal + frete);
    }

    function criarEndereco(endereco) {
        const rotulo = document.createElement("label");
        rotulo.className = "checkout-endereco";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "endereco-entrega";
        radio.value = endereco.id;
        radio.checked =
            endereco.id === estado.enderecoId;

        const texto = document.createElement("span");
        texto.className = "checkout-endereco__texto";

        const titulo = document.createElement("strong");
        titulo.textContent =
            endereco.nomeDestinatario;

        const linhaEndereco = document.createElement("span");
        linhaEndereco.textContent =
            `${endereco.logradouro}, ${endereco.numero}` +
            `${endereco.complemento
                ? `, ${endereco.complemento}`
                : ""}`;

        const localidade = document.createElement("span");
        localidade.textContent =
            `${endereco.bairro} — ${endereco.cidade}/${endereco.estado}`;

        texto.append(
            titulo,
            linhaEndereco,
            localidade
        );

        radio.addEventListener("change", () => {
            estado.enderecoId = endereco.id;
            calcularEntrega();
        });

        rotulo.append(radio, texto);
        return rotulo;
    }

    function renderizarEnderecos() {
        elementos.listaEnderecos.replaceChildren();

        const enderecos =
            estado.opcoes?.enderecos || [];

        if (enderecos.length === 0) {
            const aviso = document.createElement("p");
            aviso.className = "checkout-mensagem";
            aviso.textContent =
                "Nenhum endereço cadastrado.";
            elementos.listaEnderecos.appendChild(aviso);
            return;
        }

        if (!estado.enderecoId) {
            const principal = enderecos.find(
                (endereco) => endereco.principal
            );

            estado.enderecoId =
                principal?.id ?? enderecos[0].id;
        }

        enderecos.forEach((endereco) => {
            elementos.listaEnderecos.appendChild(
                criarEndereco(endereco)
            );
        });
    }

    function configurarEntrega() {
        const disponivel = Boolean(
            estado.opcoes.entregaPropriaDisponivel
        );

        elementos.radioEntrega.disabled = !disponivel;
        elementos.opcaoEntrega.classList.toggle(
            "checkout-opcao--indisponivel",
            !disponivel
        );

        elementos.seloEntrega.textContent = disponivel
            ? "Calcular"
            : "Em breve";

        if (!disponivel) {
            definirMensagem(
                elementos.mensagemEntrega,
                "A retirada gratuita está disponível. A entrega por distância será liberada após a ativação da API de rotas.",
                "informacao"
            );
        } else {
            definirMensagem(
                elementos.mensagemEntrega
            );
        }

        renderizarEnderecos();
    }

    async function calcularEntrega() {
        if (
            estado.metodoEntrega !==
                "entrega_propria" ||
            !estado.enderecoId
        ) {
            estado.valorFrete = 0;
            atualizarValores();
            return;
        }

        const numeroCalculo =
            estado.calculoEmAndamento + 1;

        estado.calculoEmAndamento = numeroCalculo;
        elementos.finalizar.disabled = true;

        definirMensagem(
            elementos.mensagemEntrega,
            "Calculando a distância e o valor da entrega...",
            "informacao"
        );

        try {
            const resultado = await chamarApi(
                "/checkout/calcular-entrega",
                {
                    method: "POST",
                    body: JSON.stringify({
                        enderecoId: estado.enderecoId
                    })
                }
            );

            if (
                numeroCalculo !==
                estado.calculoEmAndamento
            ) {
                return;
            }

            const entrega = resultado.data.entrega;
            estado.valorFrete = Number(
                entrega.valor
            );

            definirMensagem(
                elementos.mensagemEntrega,
                `${entrega.distanciaKm.toFixed(2)} km • ${moeda.format(entrega.valor)} • até ${entrega.prazoDiasUteis} dia útil`,
                "informacao"
            );

            atualizarValores();
        } catch (erro) {
            estado.valorFrete = 0;
            definirMensagem(
                elementos.mensagemEntrega,
                erro.message,
                "erro"
            );
        } finally {
            if (
                numeroCalculo ===
                estado.calculoEmAndamento
            ) {
                elementos.finalizar.disabled = false;
            }
        }
    }

    function alterarMetodoEntrega(evento) {
        estado.metodoEntrega = evento.target.value;
        estado.valorFrete = 0;

        const entregaPropria =
            estado.metodoEntrega ===
                "entrega_propria";

        elementos.areaEnderecos.hidden =
            !entregaPropria;

        atualizarValores();

        if (entregaPropria) {
            renderizarEnderecos();
            calcularEntrega();
            return;
        }

        configurarEntrega();
    }

    function dadosDoEndereco() {
        const dados = new FormData(
            elementos.formularioEndereco
        );

        const opcional = (nome) => {
            const valor = String(
                dados.get(nome) || ""
            ).trim();

            return valor || null;
        };

        return {
            nomeDestinatario: String(
                dados.get("nomeDestinatario")
            ).trim(),
            cep: String(dados.get("cep")).trim(),
            logradouro: String(
                dados.get("logradouro")
            ).trim(),
            numero: String(
                dados.get("numero")
            ).trim(),
            complemento: opcional("complemento"),
            bairro: String(
                dados.get("bairro")
            ).trim(),
            cidade: String(
                dados.get("cidade")
            ).trim(),
            estado: String(
                dados.get("estado")
            ).trim(),
            referencia: opcional("referencia"),
            principal:
                dados.get("principal") === "on"
        };
    }

    async function salvarEndereco(evento) {
        evento.preventDefault();
        elementos.salvarEndereco.disabled = true;
        elementos.salvarEndereco.textContent =
            "Salvando...";

        definirMensagem(
            elementos.mensagemEntrega
        );

        try {
            const resultado = await chamarApi(
                "/checkout/enderecos",
                {
                    method: "POST",
                    body: JSON.stringify(
                        dadosDoEndereco()
                    )
                }
            );

            const endereco =
                resultado.data.endereco;

            estado.opcoes.enderecos = [
                ...estado.opcoes.enderecos.filter(
                    (item) => item.id !== endereco.id
                ),
                endereco
            ];

            estado.enderecoId = endereco.id;
            elementos.formularioEndereco.reset();
            elementos.formularioEndereco.hidden = true;
            elementos.novoEndereco.hidden = false;

            renderizarEnderecos();
            await calcularEntrega();
        } catch (erro) {
            definirMensagem(
                elementos.mensagemEntrega,
                erro.message,
                "erro"
            );
        } finally {
            elementos.salvarEndereco.disabled = false;
            elementos.salvarEndereco.textContent =
                "Salvar endereço";
        }
    }

    async function finalizarPedido() {
        definirMensagem(elementos.mensagemFinal);

        if (
            estado.metodoEntrega ===
                "entrega_propria" &&
            !estado.enderecoId
        ) {
            definirMensagem(
                elementos.mensagemFinal,
                "Escolha um endereço para a entrega.",
                "erro"
            );
            return;
        }

        elementos.finalizar.disabled = true;
        elementos.finalizar.textContent =
            "Criando pedido...";

        try {
            const corpo = {
                metodoEntrega:
                    estado.metodoEntrega
            };

            if (
                estado.metodoEntrega ===
                    "entrega_propria"
            ) {
                corpo.enderecoId = estado.enderecoId;
            }

            const resultado = await chamarApi(
                "/checkout/finalizar",
                {
                    method: "POST",
                    body: JSON.stringify(corpo)
                }
            );

            const pedido = resultado.data.pedido;

            elementos.conteudo.hidden = true;
            elementos.sucesso.hidden = false;
            elementos.numeroPedido.textContent =
                `#${pedido.numeroPedido}`;

            elementos.sucessoDetalhes.textContent =
                estado.metodoEntrega === "retirada"
                    ? `Total ${moeda.format(pedido.total)}. A retirada será combinada após a confirmação do pedido.`
                    : `Total ${moeda.format(pedido.total)} com entrega.`;

            window.CarrinhoVya?.zerarContador?.();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } catch (erro) {
            definirMensagem(
                elementos.mensagemFinal,
                erro.message,
                "erro"
            );

            elementos.finalizar.disabled = false;
            elementos.finalizar.textContent =
                "Confirmar pedido";
        }
    }

    async function carregarCheckout() {
        if (estado.carregando) {
            return;
        }

        estado.carregando = true;
        elementos.carregamento.hidden = false;
        elementos.erroInicial.hidden = true;
        elementos.conteudo.hidden = true;
        elementos.sucesso.hidden = true;

        try {
            const [resultadoCarrinho, resultadoOpcoes] =
                await Promise.all([
                    chamarApi("/carrinho"),
                    chamarApi("/checkout")
                ]);

            const carrinho =
                resultadoCarrinho.data.carrinho;

            if (!carrinho.itens?.length) {
                const erro = new Error(
                    "Seu carrinho está vazio. Escolha um produto antes de continuar."
                );
                erro.codigo = "CARRINHO_VAZIO";
                throw erro;
            }

            estado.carrinho = carrinho;
            estado.opcoes = resultadoOpcoes.data;
            estado.metodoEntrega = "retirada";
            estado.enderecoId = null;
            estado.valorFrete = 0;
            estado.carregado = true;

            document.querySelector(
                "input[value='retirada']"
            ).checked = true;

            elementos.areaEnderecos.hidden = true;

            renderizarItens();
            configurarEntrega();
            atualizarValores();

            elementos.carregamento.hidden = true;
            elementos.conteudo.hidden = false;
        } catch (erro) {
            estado.carregado = false;
            mostrarErroInicial(erro);
        } finally {
            estado.carregando = false;
        }
    }

    document
        .querySelectorAll(
            "input[name='metodo-entrega']"
        )
        .forEach((radio) => {
            radio.addEventListener(
                "change",
                alterarMetodoEntrega
            );
        });

    elementos.novoEndereco.addEventListener(
        "click",
        () => {
            elementos.formularioEndereco.hidden = false;
            elementos.novoEndereco.hidden = true;
            document.querySelector(
                "#endereco-nome"
            ).focus();
        }
    );

    elementos.cancelarEndereco.addEventListener(
        "click",
        () => {
            elementos.formularioEndereco.reset();
            elementos.formularioEndereco.hidden = true;
            elementos.novoEndereco.hidden = false;
        }
    );

    elementos.formularioEndereco.addEventListener(
        "submit",
        salvarEndereco
    );

    elementos.finalizar.addEventListener(
        "click",
        finalizarPedido
    );

    elementos.tentarNovamente.addEventListener(
        "click",
        carregarCheckout
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
                carregarCheckout();
            }
        }
    );

    carregarCheckout();
})();
