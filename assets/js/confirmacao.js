/* =========================================================
   HiT Outlet — confirmação de pedido
   ========================================================= */

(function () {
  let pedido = null;
  try { pedido = JSON.parse(localStorage.getItem(CHAVE_PEDIDO) || 'null'); } catch { }

  const raiz = document.getElementById('confirmacao-conteudo');
  if (!pedido || !raiz) {
    if (raiz) {
      raiz.innerHTML = `
        <div class="vazio-estado">
          <div class="icone">📦</div>
          <h1>Nenhum pedido encontrado</h1>
          <p>Quando você finalizar uma compra, a confirmação aparece aqui.</p>
          <a class="btn btn-primario" href="catalogo.html">Ver catálogo</a>
        </div>`;
    }
    return;
  }

  document.getElementById('codigo-pedido').textContent = pedido.codigo;
  document.getElementById('conf-nome').textContent = pedido.cliente.nome;

  document.getElementById('conf-detalhes').innerHTML = `
    <div><span>Cliente</span><strong>${escapeHTML(pedido.cliente.nome)}</strong></div>
    <div><span>Entrega</span><strong>${escapeHTML(
      { padrao: 'Padrão (PAC)', expressa: 'Expressa (SEDEX)', retirada: 'Retirada na loja' }[pedido.entrega.tipo] || 'Padrão'
    )}${pedido.entrega.prazo ? ' — ' + escapeHTML(pedido.entrega.prazo) : ''}</strong></div>
    <div><span>Endereço</span><strong>${escapeHTML(
      pedido.entrega.tipo === 'retirada' ? 'Retirada na loja' :
        `${pedido.cliente.endereco}, ${pedido.cliente.numero} — ${pedido.cliente.cidade}/${pedido.cliente.uf}`
    )}</strong></div>
    <div><span>Pagamento</span><strong>${escapeHTML(
      { pix: 'PIX', cartao: 'Cartão de crédito', boleto: 'Boleto', dinheiro: 'Dinheiro na entrega' }[pedido.pagamento] || '—'
    )}</strong></div>
    ${pedido.cupom ? `<div><span>Cupom</span><strong>${escapeHTML(pedido.cupom)}</strong></div>` : ''}
    <div><span>Total do pedido</span><strong class="texto-vermelho">${formatarBRL(pedido.total)}</strong></div>`;

  document.getElementById('btn-whatsapp-confirmacao').href = linkWhatsAppPedido(pedido.codigo);
  document.getElementById('btn-loja-confirmacao').href = linkWhatsApp(
    `Olá! Quero confirmar meu pedido ${pedido.codigo}. Meu nome: ${pedido.cliente.nome}.`
  );
})();
