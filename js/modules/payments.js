// Módulo de pagos
function initPayments() {
  var modal = document.getElementById('payment-modal');
  var form = document.getElementById('payment-form');
  var amountInput = document.getElementById('payment-amount');
  var summaryNode = document.getElementById('payment-summary');
  var statusNode = document.getElementById('payment-status');
  if (!modal || !form) return;

  var currentHiring = null;
  var currentWorker = null;

  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

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

    statusNode.textContent = 'Procesando pago...';
    statusNode.className = 'payment-modal__status';

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

      statusNode.textContent = '✅ Pago completado con éxito.';
      statusNode.className = 'payment-modal__status payment-modal__status--success';

      window.dispatchEvent(new CustomEvent('hode:paymentCompleted', { detail: { hiringId: currentHiring.id } }));
      window.dispatchEvent(new CustomEvent('hode:pushNotification', { detail: { title: 'Pago realizado', body: 'Pago de $' + amount + ' completado.' } }));

      setTimeout(close, 1800);
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
