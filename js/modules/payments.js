// Módulo de pagos
function initPayments() {
  var modal = document.getElementById('payment-modal');
  var form = document.getElementById('payment-form');
  var amountInput = document.getElementById('payment-amount');
  var summaryNode = document.getElementById('payment-summary');
  var statusNode = document.getElementById('payment-status');
  var cardFields = document.getElementById('card-fields');
  if (!modal || !form) return;

  var currentHiring = null;
  var currentWorker = null;

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* Show/hide card fields based on method */
  function updateCardFields() {
    var method = form.querySelector('input[name="paymentMethod"]:checked');
    if (cardFields) {
      cardFields.style.display = method && method.value === 'stripe' ? '' : 'none';
    }
  }

  form.querySelectorAll('input[name="paymentMethod"]').forEach(function(radio) {
    radio.addEventListener('change', updateCardFields);
  });

  /* Format card number with spaces */
  var cardNum = document.getElementById('card-number');
  if (cardNum) {
    cardNum.addEventListener('input', function() {
      var v = cardNum.value.replace(/\D/g, '').slice(0, 16);
      cardNum.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  /* Format expiry */
  var cardExpiry = document.getElementById('card-expiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', function() {
      var v = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      cardExpiry.value = v;
    });
  }

  function open(opts) {
    currentHiring = opts.hiring || (opts.hiringId ? { id: opts.hiringId, amount: opts.amount } : null);
    currentWorker = opts.worker || (opts.workerName ? { id: opts.workerId, name: opts.workerName } : null);
    var workerName = currentWorker ? currentWorker.name : (opts.workerName || 'Profesional');

    summaryNode.innerHTML = '<p>Pago a <strong>' + escapeHtml(workerName) + '</strong></p>';
    if (currentHiring && currentHiring.amount) {
      amountInput.value = currentHiring.amount;
    } else {
      amountInput.value = '';
    }
    statusNode.textContent = '';
    updateCardFields();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    currentHiring = null;
    currentWorker = null;
  }

  modal.addEventListener('click', function(e) {
    if (e.target.closest('[data-close-payment]')) close();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) { statusNode.textContent = 'Ingresa un monto válido.'; return; }

    var method = form.querySelector('input[name="paymentMethod"]:checked');
    if (!method) { statusNode.textContent = 'Selecciona un método de pago.'; return; }

    /* Validate card fields for stripe */
    if (method.value === 'stripe') {
      var cn = document.getElementById('card-number');
      var ce = document.getElementById('card-expiry');
      var cc = document.getElementById('card-cvv');
      if (!cn || cn.value.replace(/\s/g, '').length < 13) { statusNode.textContent = 'Número de tarjeta inválido.'; return; }
      if (!ce || !/^\d{2}\/\d{2}$/.test(ce.value)) { statusNode.textContent = 'Fecha de vencimiento inválida.'; return; }
      if (!cc || cc.value.length < 3) { statusNode.textContent = 'CVV inválido.'; return; }
    }

    statusNode.textContent = 'Procesando pago...';
    statusNode.className = 'payment-modal__status';

    /* Simulate processing delay */
    await new Promise(function(r) { setTimeout(r, 1500); });

    try {
      // If no hiring yet, create one first
      if (!currentHiring && currentWorker) {
        currentHiring = await window.HodeApi.createHiring({
          workerId: currentWorker.id,
          description: 'Contratación desde chat',
          amount: amount
        });
      }
      if (!currentHiring) { statusNode.textContent = 'Error: no hay contratación asociada.'; return; }

      await window.HodeApi.createPayment({
        hiringId: currentHiring.id,
        method: method.value,
        amount: amount
      });

      statusNode.textContent = '✅ Pago de $' + amount.toLocaleString('es-MX') + ' MXN completado con éxito.';
      statusNode.className = 'payment-modal__status payment-modal__status--success';

      window.dispatchEvent(new CustomEvent('hode:paymentCompleted', { detail: { hiringId: currentHiring.id } }));
      window.dispatchEvent(new CustomEvent('hode:pushNotification', { detail: { title: 'Pago realizado', body: 'Pago de $' + amount.toLocaleString('es-MX') + ' MXN completado.' } }));

      setTimeout(close, 2000);
    } catch (err) {
      statusNode.textContent = '❌ ' + (err.message || 'Error al procesar el pago.');
      statusNode.className = 'payment-modal__status payment-modal__status--error';
    }
  });

  // Listen for payment open events
  window.addEventListener('hode:openPayment', function(e) {
    open(e.detail || {});
  });

  window.addEventListener('hode:chatPayment', function(e) {
    var worker = e.detail && e.detail.worker;
    if (worker) open({ worker: worker });
  });

  window.HodePayments = { open: open, close: close };
}
