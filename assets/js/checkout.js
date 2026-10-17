/* =========================================================
   HiT Outlet — checkout em 3 passos
   1) Identificação e endereço  2) Entrega  3) Pagamento e revisão
   ========================================================= */

(function () {
  const passoAtual = { n: 1 };
  let freteValor = 0;
  let fretePrazo = '';

  const secoes = {
    1: document.getElementById('passo-1'),
    2: document.getElementById('passo-2'),
    3: document.getElementById('passo-3'),
  };
  const barra = document.querySelectorAll('.passo');

  /* ---------- redireciona se sacola vazia ---------- */
  if (!lerSacola().length) {
    document.getElementById('checkout-corpo').innerHTML = `
      <div class="vazio-estado">
        <div class="icone">🛍️</div>
        <h2 class="somente-leitor">Itens do pedido</h2>
        <h3>Sua sacola está vazia</h3>
        <p>Adicione produtos antes de finalizar o pedido.</p>
        <a class="btn btn-primario" href="catalogo.html">Ver catálogo</a>
      </div>`;
    return;
  }

  /* ---------- máscaras ---------- */
  function mascaraCEP(v) {
    v = v.replace(/\D/g, '').slice(0, 8);
    return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
  }
  function mascaraTelefone(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/[-\s()]*$/, '');
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/[-\s()]*$/, '');
  }

  const campoCEP = document.getElementById('cep');
  const campoTel = document.getElementById('telefone');
  campoCEP.addEventListener('input', () => { campoCEP.value = mascaraCEP(campoCEP.value); });
  campoTel.addEventListener('input', () => { campoTel.value = mascaraTelefone(campoTel.value); });

  /* ---------- ViaCEP ---------- */
  campoCEP.addEventListener('blur', async () => {
    const cep = campoCEP.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    const status = document.getElementById('status-cep');
    status.textContent = 'Consultando CEP...';
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resp.json();
      if (dados.erro) {
        status.textContent = 'CEP não encontrado. Preencha o endereço manualmente.';
        return;
      }
      document.getElementById('endereco').value = dados.logradouro || '';
      document.getElementById('bairro').value = dados.bairro || '';
      document.getElementById('cidade').value = dados.localidade || '';
      document.getElementById('uf').value = dados.uf || '';
      status.textContent = '✓ Endereço preenchido automaticamente.';
    } catch {
      status.textContent = 'Não foi possível consultar o CEP. Preencha manualmente.';
    }
  });

  /* ---------- validação do passo 1 ---------- */
  function validarPasso1() {
    let ok = true;
    const obrigatorios = ['nome', 'email', 'telefone', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'uf'];
    obrigatorios.forEach(campo => {
      const input = document.getElementById(campo);
      const wrap = input.closest('.campo');
      let valido = input.value.trim().length > 0;
      if (campo === 'email' && valido) valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      if (campo === 'telefone' && valido) valido = input.value.replace(/\D/g, '').length >= 10;
      if (campo === 'cep' && valido) valido = input.value.replace(/\D/g, '').length === 8;
      if (campo === 'uf' && valido) valido = input.value.trim().length === 2;
      wrap.classList.toggle('invalido', !valido);
      if (!valido && ok) { input.focus(); }
      if (!valido) ok = false;
    });
    return ok;
  }

  function dadosCliente() {
    const get = id => document.getElementById(id).value.trim();
    return {
      nome: get('nome'), email: get('email'), telefone: get('telefone'),
      cep: get('cep'), endereco: get('endereco'), numero: get('numero'),
      complemento: get('complemento'), bairro: get('bairro'),
      cidade: get('cidade'), uf: get('uf').toUpperCase(),
    };
  }

  /* ---------- passo 2: entrega ---------- */
  function opcaoEntrega() {
    const input = document.querySelector('input[name="entrega"]:checked');
    return input ? input.value : 'padrao';
  }

  function aplicarFretePasso2() {
    const subtotal = subtotalSacola();
    const op = opcaoEntrega();
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    const elPrazo = document.getElementById('frete-prazo-info');

    if (op === 'retirada') {
      freteValor = 0;
      fretePrazo = 'Retirar na loja';
      elPrazo.innerHTML = `Retirada na loja: <strong>Jardim Brasília — ao lado da Mega 25, Águas Lindas de Goiás</strong>. ${escapeHTML(LOJA.atendimento)}.`;
      elPrazo.className = 'frete-calculado ok';
      atualizarResumoPedido();
      return;
    }
    if (cep.length !== 8) {
      elPrazo.textContent = 'Informe um CEP válido no passo anterior para calcular o frete.';
      elPrazo.className = 'frete-calculado';
      freteValor = 0;
      atualizarResumoPedido();
      return;
    }
    const r = calcularFreteLocal(cep, subtotal);
    if (op === 'expressa' && r) {
      freteValor = r.valor + 12;
      fretePrazo = r.prazoExpresso;
      elPrazo.innerHTML = `Entrega expressa: <strong>${escapeHTML(fretePrazo)}</strong> — ${formatarBRL(freteValor)}`;
      elPrazo.className = 'frete-calculado ok';
    } else if (r) {
      freteValor = r.valor;
      fretePrazo = r.prazo;
      elPrazo.innerHTML = `Entrega padrão: <strong>${escapeHTML(fretePrazo)}</strong> — ${formatarBRL(freteValor)}${r.gratis ? ' (frete grátis!)' : ''}`;
      elPrazo.className = 'frete-calculado ok';
    } else {
      freteValor = 0;
      elPrazo.textContent = 'Não foi possível estimar o frete. Chame no WhatsApp que calculamos para você.';
      elPrazo.className = 'frete-calculado';
    }
    atualizarResumoPedido();
  }

  document.querySelectorAll('input[name="entrega"]').forEach(r =>
    r.addEventListener('change', aplicarFretePasso2));

  /* ---------- passo 3: pagamento ---------- */
  function opcaoPagamento() {
    const input = document.querySelector('input[name="pagamento"]:checked');
    return input ? input.value : 'pix';
  }

  function atualizarPagamento() {
    const op = opcaoPagamento();
    document.getElementById('detalhe-pix').hidden = op !== 'pix';
    document.getElementById('detalhe-cartao').hidden = op !== 'cartao';
    document.getElementById('campo-cpf').hidden = op !== 'pix' && op !== 'boleto';
    document.getElementById('detalhe-dinheiro').hidden = op !== 'dinheiro';
  }
  document.querySelectorAll('input[name="pagamento"]').forEach(r =>
    r.addEventListener('change', () => {
      atualizarPagamento();
      atualizarResumoPedido();   // Pix altera o total exibido
    }));

  /* ---------- resumo do pedido (coluna lateral) ---------- */
  function renderResumoLateral() {
    const itens = lerSacola();
    document.getElementById('resumo-lateral-itens').innerHTML = itens.map(i => {
      const p = obterProduto(i.id);
      const v = [i.tamanho, i.cor].filter(Boolean).join(' · ');
      return `<div class="novo-item-sacola">
        <img src="${p.imagens[0]}" alt="">
        <div>
          <strong>${escapeHTML(p.nome)}</strong>
          ${v ? `<div class="texto-pequeno texto-suave">${escapeHTML(v)}</div>` : ''}
          <div class="texto-pequeno texto-suave">Qtd: ${i.qtd}</div>
        </div>
        <span class="qi">${formatarBRL(p.preco * i.qtd)}</span>
      </div>`;
    }).join('');
    atualizarResumoPedido();
  }

  /* Total único: subtotal − (cupom + Pix) + frete.
     Usado pelo resumo lateral e pela conclusão do pedido, para que o
     valor mostrado sempre seja o valor cobrado. */
  function totalFinal() {
    const subtotal = subtotalSacola();
    const descontoC = descontoCupom(subtotal);
    const base = Math.max(0, subtotal - descontoC) + freteValor;
    const pixDesconto = opcaoPagamento() === 'pix' && LOJA.pixDescontoPercentual
      ? base * (LOJA.pixDescontoPercentual / 100)
      : 0;
    return { subtotal, descontoC, pixDesconto, total: base - pixDesconto };
  }

  function atualizarResumoPedido() {
    const { subtotal, descontoC, pixDesconto, total } = totalFinal();
    const descontoTotal = descontoC + pixDesconto;
    document.getElementById('resumo-lateral-subtotal').textContent = formatarBRL(subtotal);
    const elDesc = document.getElementById('resumo-lateral-desconto-linha');
    if (descontoTotal > 0) {
      elDesc.style.display = 'flex';
      const rotulos = [];
      if (descontoC > 0) rotulos.push('cupom');
      if (pixDesconto > 0) rotulos.push('Pix');
      elDesc.querySelector('span').textContent =
        rotulos.length > 1 ? `Descontos (${rotulos.join(' + ')})` : `Desconto ${rotulos[0]}`;
      document.getElementById('resumo-lateral-desconto').textContent = '− ' + formatarBRL(descontoTotal);
    } else elDesc.style.display = 'none';
    document.getElementById('resumo-lateral-frete').textContent =
      freteValor > 0 ? formatarBRL(freteValor) : (opcaoEntrega() === 'retirada' ? 'Grátis' : 'A calcular');
    document.getElementById('resumo-lateral-total').textContent = formatarBRL(total);
  }

  /* ---------- navegação entre passos ---------- */
  function irParaPasso(n) {
    passoAtual.n = n;
    [1, 2, 3].forEach(i => { secoes[i].hidden = i !== n; });
    barra.forEach((p, idx) => {
      p.classList.toggle('ativo', idx + 1 === n);
      p.classList.toggle('concluido', idx + 1 < n);
    });
    document.getElementById('checkout-topo')?.scrollIntoView({ behavior: 'smooth' });
    if (n === 2) aplicarFretePasso2();
    if (n === 3) renderRevisao();
  }

  document.getElementById('btn-ir-passo-2')?.addEventListener('click', () => {
    if (validarPasso1()) irParaPasso(2);
  });
  document.getElementById('btn-voltar-1')?.addEventListener('click', () => irParaPasso(1));
  document.getElementById('btn-ir-passo-3')?.addEventListener('click', () => irParaPasso(3));
  document.getElementById('btn-voltar-2')?.addEventListener('click', () => irParaPasso(2));

  /* ---------- revisão no passo 3 ---------- */
  function renderRevisao() {
    const c = dadosCliente();
    const entrega = opcaoEntrega();
    const entregaTexto = {
      padrao: 'Entrega padrão (PAC)', expressa: 'Entrega expressa (SEDEX)', retirada: 'Retirar na loja'
    }[entrega];

    document.getElementById('rev-cliente').innerHTML = `
      <strong>${escapeHTML(c.nome)}</strong><br>
      ${escapeHTML(c.email)} · ${escapeHTML(c.telefone)}`;
    document.getElementById('rev-endereco').innerHTML = entrega === 'retirada'
      ? `Retirada na loja — ${escapeHTML(LOJA.endereco)}`
      : `${escapeHTML(c.endereco)}, ${escapeHTML(c.numero)}${c.complemento ? ' — ' + escapeHTML(c.complemento) : ''}<br>
         ${escapeHTML(c.bairro)} — ${escapeHTML(c.cidade)}/${escapeHTML(c.uf)} — CEP ${escapeHTML(c.cep)}`;
    document.getElementById('rev-entrega').textContent =
      `${entregaTexto}${fretePrazo ? ' — ' + fretePrazo : ''}`;

    const pagTexto = {
      pix: `PIX (${LOJA.pixDescontoPercentual}% de desconto)`,
      cartao: 'Cartão de crédito (até 10x sem juros)',
      boleto: 'Boleto bancário',
      dinheiro: 'Dinheiro na entrega'
    }[opcaoPagamento()];
    document.getElementById('rev-pagamento').textContent = pagTexto;
    const elCpf = document.getElementById('rev-cpf');
    const cpf = document.getElementById('cpf').value.trim();
    elCpf.textContent = cpf ? `CPF: ${cpf}` : '';
    const troco = document.getElementById('troco').value.trim();
    document.getElementById('rev-troco').textContent =
      opcaoPagamento() === 'dinheiro' && troco ? `Troco para: R$ ${troco}` : '';
  }

  document.querySelectorAll('.btn-editar-secao').forEach(btn =>
    btn.addEventListener('click', () => irParaPasso(Number(btn.dataset.passo))));

  document.getElementById('btn-voltar-sacola')?.addEventListener('click', () => {
    window.location.href = 'sacola.html';
  });

  /* ---------- conclusão ---------- */
  document.getElementById('btn-concluir')?.addEventListener('click', () => {
    const aceite = document.getElementById('aceite-termos');
    const elAviso = document.getElementById('aviso-termos');
    if (!aceite.checked) {
      elAviso.style.display = 'block';
      aceite.focus();
      return;
    }
    elAviso.style.display = 'none';

    const c = dadosCliente();
    const { subtotal, descontoC, pixDesconto, total } = totalFinal();
    const codigo = 'HIT-' + String(Date.now()).slice(-6);

    const pedido = {
      codigo,
      data: new Date().toISOString(),
      cliente: c,
      itens: lerSacola().map(i => {
        const p = obterProduto(i.id);
        return {
          id: i.id, nome: p.nome, preco: p.preco, qtd: i.qtd,
          tamanho: i.tamanho, cor: i.cor, imagem: p.imagens[0],
        };
      }),
      entrega: { tipo: opcaoEntrega(), prazo: fretePrazo, frete: freteValor },
      pagamento: opcaoPagamento(),
      subtotal, desconto: descontoC, descontoPix: pixDesconto, total,
      cupom: lerCupom() || null,
    };
    localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
    localStorage.setItem(CHAVE_CLIENTE, JSON.stringify(c));
    limparSacola();
    window.location.href = 'confirmacao.html';
  });

  /* ---------- restaura cliente anterior ---------- */
  try {
    const anterior = JSON.parse(localStorage.getItem(CHAVE_CLIENTE) || 'null');
    if (anterior) {
      Object.entries({ nome: 'nome', email: 'email', telefone: 'telefone', cep: 'cep', endereco: 'endereco', numero: 'numero', complemento: 'complemento', bairro: 'bairro', cidade: 'cidade', uf: 'uf' })
        .forEach(([campo, idCampo]) => {
          const el = document.getElementById(idCampo);
          if (el && anterior[campo]) el.value = anterior[campo];
        });
    }
  } catch { /* ignora */ }

  /* ---------- boot ---------- */
  renderResumoLateral();
  atualizarPagamento();

  // se veio CEP calculado na sacola
  const cepSessao = sessionStorage.getItem('hit_cep');
  if (cepSessao && campoCEP && !campoCEP.value) {
    campoCEP.value = mascaraCEP(cepSessao);
  }
})();
