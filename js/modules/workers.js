// Módulo de trabajadores: render, búsqueda, filtros y perfil
function initWorkers() {
  const fallbackWorkers = [
    {
      id: 1,
      name: 'María González',
      specialty: 'Desarrolladora Web',
      rating: 4.9,
      reviewsCount: 127,
      city: 'Bogotá',
      lat: 4.711,
      lng: -74.0721,
      hourly: '$28/h',
      response: 'Horario flexible · Responde en 15 min',
      tags: ['Web', 'E-commerce', 'SEO'],
      about: 'Desarrollo sitios y tiendas online con foco en rendimiento y conversiones. Trabajo con entregas claras y comunicación constante.',
      reviews: [
        { author: 'Daniela P.', text: 'Cumplió tiempos y mejoró la velocidad de mi sitio. Muy profesional.' },
        { author: 'Andrés M.', text: 'Excelente comunicación y propuesta técnica muy clara.' }
      ],
      welcome: [
        'Hola, María por aquí 👋',
        'Cuéntame qué tipo de web necesitas y te comparto un plan rápido.'
      ]
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      specialty: 'Electricista',
      rating: 4.8,
      reviewsCount: 89,
      city: 'Medellín',
      lat: 6.2442,
      lng: -75.5812,
      hourly: '$18/h',
      response: 'Horario flexible · Responde en 10 min',
      tags: ['Hogar', 'Comercial', 'Urgencias'],
      about: 'Especialista en instalaciones residenciales y comerciales. Priorizo seguridad y diagnóstico preciso en cada visita.',
      reviews: [
        { author: 'Laura M.', text: 'Solucionó una falla compleja el mismo día. Muy recomendado.' },
        { author: 'Jhon C.', text: 'Ordenado, puntual y transparente con costos.' }
      ],
      welcome: [
        '¡Hola! Soy Carlos ⚡',
        'Si me compartes fotos del problema, te doy una orientación inicial.'
      ]
    },
    {
      id: 3,
      name: 'Ana López',
      specialty: 'Diseñadora Gráfica',
      rating: 4.9,
      reviewsCount: 156,
      city: 'Cali',
      lat: 3.4516,
      lng: -76.532,
      hourly: '$22/h',
      response: 'Horario flexible · Responde en 25 min',
      tags: ['Branding', 'Social Media', 'UI'],
      about: 'Diseño identidad visual y piezas de alto impacto para marcas que quieren verse profesionales y consistentes.',
      reviews: [
        { author: 'Valeria S.', text: 'El rediseño de marca subió nuestro engagement en redes.' },
        { author: 'Pedro R.', text: 'Creativa y con excelente criterio para comunicar.' }
      ],
      welcome: [
        'Hola, soy Ana 🎨',
        'Te puedo ayudar con una propuesta visual alineada a tu marca.'
      ]
    },
    {
      id: 4,
      name: 'Santiago Herrera',
      specialty: 'Plomero',
      rating: 4.7,
      reviewsCount: 74,
      city: 'Bogotá',
      lat: 4.628,
      lng: -74.065,
      hourly: '$16/h',
      response: 'Horario Un poco flexible · Responde en 35 min',
      tags: ['Hogar', 'Urgencias', 'Mantenimiento'],
      about: 'Atiendo fugas, instalaciones y mantenimiento preventivo. Trabajo limpio, rápido y con garantía.',
      reviews: [
        { author: 'Nicolás V.', text: 'Llegó rápido y dejó todo funcionando perfecto.' }
      ],
      welcome: [
        'Hola, Santiago aquí 🔧',
        '¿Es una urgencia o mantenimiento programado?' 
      ]
    },
    {
      id: 5,
      name: 'Paula Ríos',
      specialty: 'Marketing Digital',
      rating: 4.8,
      reviewsCount: 101,
      city: 'Barranquilla',
      lat: 10.9685,
      lng: -74.7813,
      hourly: '$26/h',
      response: 'Horario flexible · Responde en 20 min',
      tags: ['Ads', 'SEO', 'Contenido'],
      about: 'Creo estrategias para captar clientes con campañas medibles y optimización continua.',
      reviews: [
        { author: 'Miguel T.', text: 'Duplicamos leads en 6 semanas con su estrategia.' }
      ],
      welcome: [
        '¡Hola! Soy Paula 📈',
        'Si tienes objetivo de ventas, lo aterrizamos en un plan de campaña.'
      ]
    },
    {
      id: 6,
      name: 'Diego Cárdenas',
      specialty: 'Técnico de Aire Acondicionado',
      rating: 4.8,
      reviewsCount: 63,
      city: 'Medellín',
      lat: 6.251,
      lng: -75.563,
      hourly: '$20/h',
      response: 'Horario Estricto · Responde en 1-2 hrs',
      tags: ['Mantenimiento', 'Comercial', 'Instalación'],
      about: 'Instalación y mantenimiento de equipos residenciales y comerciales con protocolos de calidad.',
      reviews: [
        { author: 'Empresa Nova', text: 'Mantenimiento eficiente para nuestras oficinas.' }
      ],
      welcome: [
        'Hola, soy Diego ❄️',
        'Te ayudo a revisar capacidad, instalación o mantenimiento del equipo.'
      ]
    }
  ];

  const searchInput = document.getElementById('worker-search');
  const filtersContainer = document.getElementById('worker-filters');
  const grid = document.getElementById('professionals-grid');
  const modal = document.getElementById('worker-modal');
  const modalContent = document.getElementById('worker-modal-content');

  if (!searchInput || !filtersContainer || !grid || !modal || !modalContent) {
    return;
  }

  let workers = fallbackWorkers.slice();
  let query = '';
  let activeTag = 'Todos';
  let allTags = ['Todos'].concat([...new Set(workers.flatMap(worker => worker.tags))]);

  function enrichWorker(worker) {
    const fallback = fallbackWorkers.find(item => item.id === worker.id);
    if (fallback) {
      return {
        ...fallback,
        ...worker,
        tags: worker.tags && worker.tags.length ? worker.tags : fallback.tags,
        reviews: fallback.reviews,
        welcome: fallback.welcome
      };
    }

    var avatar = '';
    try {
      var session = JSON.parse(localStorage.getItem('hode_session') || 'null');
      if (session && session.role === 'pro' && session.id === worker.userId) {
        avatar = localStorage.getItem('hode_profile_avatar') || '';
      }
    } catch (e) { /* noop */ }

    return {
      id: worker.id,
      name: worker.name,
      specialty: worker.specialty,
      rating: worker.rating || 5.0,
      reviewsCount: 0,
      city: worker.city,
      hourly: '$20/h',
      response: 'Responde en 30 min',
      tags: worker.tags || [],
      about: worker.bio || 'Profesional verificado en HoDe.',
      reviews: [],
      welcome: ['Hola, cuéntame qué servicio necesitas.'],
      avatar: worker.avatar || avatar,
      userId: worker.userId || null
    };
  }

  function syncWorkerRegistry() {
    window.HodeWorkers = {
      findById: function(id) {
        return workers.find(function(item) { return item.id === id; }) || null;
      },
      list: function() {
        return workers.slice();
      }
    };
  }

  function starString(rating) {
    return `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}`;
  }

  function renderFilters() {
    filtersContainer.innerHTML = allTags.map(tag => `
      <button
        type="button"
        class="professionals__filter ${activeTag === tag ? 'is-active' : ''}"
        data-tag="${tag}"
      >${tag}</button>
    `).join('');
  }

  function recalculateTags() {
    allTags = ['Todos'].concat([...new Set(workers.flatMap(worker => worker.tags))]);
    if (!allTags.includes(activeTag)) {
      activeTag = 'Todos';
    }
  }

  function workerMatches(worker) {
    const normalizedQuery = query.trim().toLowerCase();
    const text = `${worker.name} ${worker.specialty} ${worker.tags.join(' ')} ${worker.city}`.toLowerCase();
    const matchesQuery = normalizedQuery ? text.includes(normalizedQuery) : true;
    const matchesTag = activeTag === 'Todos' ? true : worker.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  }

  function getAvatarHtml(worker) {
    if (worker.avatar) {
      return '<img class="professional-card__photo" src="' + worker.avatar + '" alt="' + worker.name + '">';
    }
    return worker.name.charAt(0);
  }

  function renderGrid() {
    const filtered = workers.filter(workerMatches);

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="professionals__empty">
          <h3>No encontramos resultados con esos filtros</h3>
          <p>Prueba con otra especialidad o elimina un filtro.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(worker => `
      <article class="professional-card">
        <div class="professional-card__image${worker.avatar ? ' professional-card__image--has-photo' : ''}">${getAvatarHtml(worker)}</div>
        <div class="professional-card__content">
          <h3 class="professional-card__name">${worker.name}</h3>
          <p class="professional-card__specialty">${worker.specialty} · ${worker.city}</p>
          <div class="professional-card__tags">
            ${worker.tags.map(tag => `<span class="professional-card__tag">${tag}</span>`).join('')}
          </div>
          <div class="professional-card__rating">
            <span class="professional-card__stars">${starString(worker.rating)}</span>
            <span class="professional-card__rating-text">${worker.rating} (${worker.reviewsCount} reseñas)</span>
          </div>
          <p class="professional-card__specialty">${worker.hourly} · ${worker.response}</p>
          <div class="professional-card__actions">
            <button type="button" class="btn btn-primary professional-card__button" data-action="contact" data-worker-id="${worker.id}">Contactar</button>
            <button type="button" class="professional-card__profile" data-action="profile" data-worker-id="${worker.id}">Ver perfil</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function openModal(worker) {
    modalContent.innerHTML = `
      <div class="worker-profile__header">
        <div class="worker-profile__avatar">${worker.name.charAt(0)}</div>
        <div class="worker-profile__meta">
          <h3 id="worker-modal-title">${worker.name}</h3>
          <p>${worker.specialty} · ${worker.city}</p>
          <p>${worker.rating} (${worker.reviewsCount} reseñas) · ${worker.hourly}</p>
        </div>
      </div>

      <section class="worker-profile__about">
        <h4>Sobre ${worker.name.split(' ')[0]}</h4>
        <p>${worker.about}</p>
      </section>

      <section>
        <h4>Reseñas destacadas</h4>
        <div class="worker-profile__reviews">
          ${worker.reviews.map(review => `
            <article class="worker-profile__review">
              <strong>${review.author}</strong>
              <p>${review.text}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <section>
        <h4>Dejar un comentario</h4>
        <form class="worker-profile__comment-form" data-comment-form="${worker.id}">
          <textarea maxlength="320" placeholder="Comparte tu experiencia con este profesional" required></textarea>
          <div class="worker-profile__actions">
            <button type="submit" class="btn btn-primary">Publicar comentario</button>
            <button type="button" class="btn btn-secondary" data-action="contact" data-worker-id="${worker.id}">Contactar ahora</button>
          </div>
        </form>
      </section>
    `;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function notifyChat(worker) {
    window.dispatchEvent(new CustomEvent('hode:startChat', { detail: { worker } }));
  }

  filtersContainer.addEventListener('click', function(event) {
    const target = event.target.closest('[data-tag]');
    if (!target) {
      return;
    }
    activeTag = target.getAttribute('data-tag');
    renderFilters();
    renderGrid();
  });

  searchInput.addEventListener('input', function(event) {
    query = event.target.value;
    renderGrid();
  });

  grid.addEventListener('click', function(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    const workerId = Number(button.getAttribute('data-worker-id'));
    const worker = workers.find(item => item.id === workerId);
    if (!worker) {
      return;
    }

    if (button.getAttribute('data-action') === 'contact') {
      notifyChat(worker);
      return;
    }

    if (button.getAttribute('data-action') === 'profile') {
      window.dispatchEvent(new CustomEvent('hode:openPublicProfile', { detail: { worker: worker } }));
    }
  });

  modal.addEventListener('click', function(event) {
    if (event.target.closest('[data-close-modal]')) {
      closeModal();
      return;
    }

    const button = event.target.closest('[data-action="contact"]');
    if (button) {
      const workerId = Number(button.getAttribute('data-worker-id'));
      const worker = workers.find(item => item.id === workerId);
      if (worker) {
        notifyChat(worker);
      }
      closeModal();
    }
  });

  modalContent.addEventListener('submit', function(event) {
    const form = event.target.closest('[data-comment-form]');
    if (!form) {
      return;
    }

    event.preventDefault();
    const workerId = Number(form.getAttribute('data-comment-form'));
    const textarea = form.querySelector('textarea');
    const text = textarea.value.trim();
    if (!text) {
      return;
    }

    const worker = workers.find(item => item.id === workerId);
    if (!worker) {
      return;
    }

    worker.reviews.unshift({ author: 'Usuario HoDe', text: text });
    worker.reviewsCount += 1;
    openModal(worker);
    renderGrid();
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  async function loadWorkersFromApi() {
    if (!window.HodeApi) {
      return;
    }

    try {
      const response = await window.HodeApi.listWorkers({ search: '', tag: '' });
      if (!Array.isArray(response) || !response.length) {
        return;
      }

      workers = response.map(enrichWorker);
      recalculateTags();
      renderFilters();
      renderGrid();
      syncWorkerRegistry();
    } catch (error) {
      // Si la API no está disponible, usamos fallback local.
    }
  }

  syncWorkerRegistry();
  renderFilters();
  renderGrid();
  loadWorkersFromApi();
}
