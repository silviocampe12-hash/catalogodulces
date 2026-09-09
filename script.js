const SHEET_ID = "1pwgSaZIgQ8ezc1N3jIpH1YR6RJ4OQZgBC-4gWErFHIo";
  const GID = "0";

  const CONTACTO = {
    email: "dianelaferrari331@gmail.com",
    whatsapp: "543472449388",
    horario: "Todos los días de 08:00 a 19:00"
  };

  const content = document.getElementById('content');
  const chipRow = document.getElementById('chipRow');
  const searchInput = document.getElementById('searchInput');

  let allProducts = [];
  let allCategories = [];
  let activeFilter = 'Todos';
  let currentFiltered = [];
  let currentProduct = null;

  function driveDirectUrl(url){
    const u = (url || '').toString().trim();
    if (!u) return u;
    const patterns = [
      /drive\.google\.com\/file\/d\/([^/?]+)/,
      /drive\.google\.com\/open\?id=([^&]+)/,
      /drive\.google\.com\/uc\?[^#]*[?&]id=([^&]+)/,
      /[?&]id=([^&]+).*drive\.google\.com/
    ];
    for (const re of patterns){
      const m = u.match(re);
      if (m && m[1]) return `https://lh3.googleusercontent.com/d/${m[1]}`;
    }
    return u;
  }

  function splitList(str){
    return (str || '').toString().split(',').map(s => s.trim()).filter(Boolean);
  }
  function splitPipe(str){
    return (str || '').toString().split('|').map(s => driveDirectUrl(s.trim()));
  }
  function isNuevo(v){
    const s = (v || '').toString().trim().toLowerCase();
    return ['si','sí','yes','true','1'].includes(s);
  }

  function parseSinStock(str, colores, talles){
    const out = { colores: new Set(), talles: new Set(), pares: new Set() };
    (str || '').toString().split('|').map(s => s.trim()).filter(Boolean).forEach(entry => {
      if (entry.includes(' - ')){
        const [c, t] = entry.split(' - ').map(s => s.trim());
        out.pares.add(c.toLowerCase() + '|' + t.toLowerCase());
        return;
      }
      const low = entry.toLowerCase();
      const colorMatch = colores.find(c => c.toLowerCase() === low);
      const talleMatch = talles.find(t => t.toLowerCase() === low);
      if (colorMatch) out.colores.add(colorMatch.toLowerCase());
      else if (talleMatch) out.talles.add(talleMatch.toLowerCase());
    });
    return out;
  }

  function comboAgotado(p, color, talle){
    const c = (color || '').toLowerCase();
    const t = (talle || '').toLowerCase();
    if (c && p.sinStock.colores.has(c)) return true;
    if (t && p.sinStock.talles.has(t)) return true;
    if (c && t && p.sinStock.pares.has(c + '|' + t)) return true;
    return false;
  }

  function productoDisponible(p){
    if (p.colores.length || p.talles.length){
      const colores = p.colores.length ? p.colores : [null];
      const talles = p.talles.length ? p.talles : [null];
      for (const c of colores){
        for (const t of talles){
          if (!comboAgotado(p, c, t)) return true;
        }
      }
      return false;
    }
    return isInStock(p.stock);
  }

  function renderState(title, msg, extraHTML=''){
    content.innerHTML = `<div class="state"><h2>${title}</h2><p>${msg}</p>${extraHTML}</div>`;
  }

  function isInStock(v){
    const s = (v||'').toString().trim().toLowerCase();
    if (s === '') return true;
    if (['no','0','false','agotado','sin stock'].includes(s)) return false;
    if (['si','sí','yes','true'].includes(s)) return true;
    const n = parseFloat(s.replace(',', '.'));
    if (!isNaN(n)) return n > 0;
    return true;
  }

  function makeChip(cat){
    const el = document.createElement('button');
    el.className = 'chip' + (cat === activeFilter ? ' active' : '');
    el.textContent = cat;
    el.addEventListener('click', () => { activeFilter = cat; renderGrid(); renderChips(allCategories); });
    return el;
  }

  function renderChips(categories){
    chipRow.innerHTML = '';
    chipRow.appendChild(makeChip('Todos'));
    if (allProducts.some(p => p.esNuevo)){
      chipRow.appendChild(makeChip('Nuevos ingresos'));
    }
    if (categories.length){
      const select = document.createElement('select');
      select.className = 'cat-select';
      const isCategorySelected = !['Todos','Nuevos ingresos'].includes(activeFilter);
      select.innerHTML = `<option value="">Categorías</option>` +
        categories.map(c => `<option value="${c}" ${isCategorySelected && activeFilter === c ? 'selected' : ''}>${c}</option>`).join('');
      select.addEventListener('change', () => {
        if (select.value){ activeFilter = select.value; renderGrid(); renderChips(categories); }
      });
      chipRow.appendChild(select);
    }
  }

  function renderGrid(){
    const query = (searchInput.value || '').toLowerCase().trim();
    const filtered = allProducts.filter(p => {
      let matchFilter;
      if (activeFilter === 'Todos') matchFilter = true;
      else if (activeFilter === 'Nuevos ingresos') matchFilter = p.esNuevo;
      else matchFilter = p.categoria === activeFilter;
      const matchQuery = !query || p.nombre.toLowerCase().includes(query) || p.descripcion.toLowerCase().includes(query);
      return matchFilter && matchQuery;
    });
    currentFiltered = filtered;
    if (filtered.length === 0){
      content.innerHTML = `<div class="state"><h2>Nada por aquí</h2><p>Probá con otra palabra o categoría.</p></div>`;
      return;
    }
    content.innerHTML = `<div class="grid">${filtered.map((p, idx) => cardHTML(p, idx)).join('')}</div>`;
  }

 function cardHTML(p, idx){

  const rawPrice = (p.precio || '').replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',', '.');
  const priceNum = parseFloat(rawPrice);
  const priceLabel = isNaN(priceNum) ? (p.precio || '—') : '$' + priceNum.toLocaleString('es-AR');


  const rawOldPrice = (p.precioAnterior || '').replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',', '.');
  const oldPriceNum = parseFloat(rawOldPrice);
  const oldPriceLabel = isNaN(oldPriceNum) ? p.precioAnterior : '$' + oldPriceNum.toLocaleString('es-AR');

  const stockOk = productoDisponible(p);

  return `
    <article class="card" onclick="openDetail(${idx})">
      <div class="thumb">
        ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=noimg>Sin imagen</span>'">` : `<span class="noimg">Sin imagen</span>`}
        <span class="stock-tag ${stockOk ? 'in':'out'}">${stockOk ? 'Disponible' : 'Agotado'}</span>
      </div>
      <div class="body">
        ${p.categoria ? `<p class="category">${p.categoria}</p>` : ''}
        <h3 class="name">${p.nombre || 'Producto sin nombre'}</h3>
        <p class="desc">${p.descripcion || ''}</p>
        <div class="flourish"><svg viewBox="0 0 24 24" fill="currentColor" style="color:var(--accent)"><circle cx="12" cy="12" r="4"/></svg></div>
        <div class="price-row" style="display:flex; gap:8px; align-items:baseline; justify-content:center;">
          ${oldPriceLabel ? `<span class="price-old" style="text-decoration: line-through; color: #A23B56; font-size: 15px;">${oldPriceLabel}</span>` : ''}
          <span class="price">${priceLabel}</span>
        </div>
      </div>
    </article>`;
}

  function openDetail(idx){
    const p = currentFiltered[idx];
    if (!p) return;
    currentProduct = p;

    document.getElementById('modalCategory').textContent = p.categoria || '';
    document.getElementById('modalName').textContent = p.nombre || 'Producto sin nombre';
    document.getElementById('modalDesc').textContent = p.descripcion || '';


const rawPrice = (p.precio||'').replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',', '.');
const priceNum = parseFloat(rawPrice);
const priceLabel = isNaN(priceNum) ? (p.precio || '—') : '$' + priceNum.toLocaleString('es-AR');

const rawOldPrice = (p.precioAnterior || '').replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',', '.');
const oldPriceNum = parseFloat(rawOldPrice);
const oldPriceLabel = isNaN(oldPriceNum) ? p.precioAnterior : '$' + oldPriceNum.toLocaleString('es-AR');

const modalPriceEl = document.getElementById('modalPrice');
if (oldPriceLabel) {
  modalPriceEl.innerHTML = `<span style="text-decoration: line-through; color: #A23B56; font-size: 18px; margin-right: 8px;">${oldPriceLabel}</span> <span>${priceLabel}</span>`;
} else {
  modalPriceEl.textContent = priceLabel;
}

    const colorSelect = document.getElementById('modalColorSelect');
    const colorWrap = document.getElementById('modalColorWrap');
    colorSelect.innerHTML = '';
    if (p.colores && p.colores.length){
      colorWrap.style.display = 'flex';
      let firstDisponible = -1;
      p.colores.forEach((c, i) => {
        const agotado = p.talles.length
          ? p.talles.every(t => comboAgotado(p, c, t))
          : comboAgotado(p, c, null);
        if (!agotado && firstDisponible === -1) firstDisponible = i;
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = c + (agotado ? ' (Agotado)' : '');
        colorSelect.appendChild(opt);
      });
      colorSelect.value = firstDisponible !== -1 ? firstDisponible : 0;
      colorSelect.onchange = () => { renderSizeOptions(); updateModalImage(); refreshModalStock(); };
    } else {
      colorWrap.style.display = 'none';
    }

    renderSizeOptions();
    updateModalImage();
    refreshModalStock();
    const waBtn = document.getElementById('modalWhatsappBtn');
    waBtn.style.display = (CONTACTO.whatsapp && !CONTACTO.whatsapp.includes('PEGA_AQUI')) ? 'flex' : 'none';
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderSizeOptions(){
    const p = currentProduct;
    const sizeSelect = document.getElementById('modalSizeSelect');
    const sizeWrap = document.getElementById('modalSizeWrap');
    sizeSelect.innerHTML = '';
    if (!p.talles || !p.talles.length){
      sizeWrap.style.display = 'none';
      return;
    }
    sizeWrap.style.display = 'flex';
    const colorSelect = document.getElementById('modalColorSelect');
    const colorActual = (p.colores && p.colores.length) ? p.colores[parseInt(colorSelect.value, 10)] : null;
    let firstDisponible = -1;
    p.talles.forEach((t, i) => {
      const agotado = comboAgotado(p, colorActual, t);
      if (!agotado && firstDisponible === -1) firstDisponible = i;
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t + (agotado ? ' (Agotado)' : '');
      sizeSelect.appendChild(opt);
    });
    sizeSelect.selectedIndex = firstDisponible !== -1 ? firstDisponible : 0;
    sizeSelect.onchange = refreshModalStock;
  }

  function refreshModalStock(){
    const p = currentProduct;
    const colorSelect = document.getElementById('modalColorSelect');
    const sizeSelect = document.getElementById('modalSizeSelect');
    const color = (p.colores && p.colores.length) ? p.colores[parseInt(colorSelect.value, 10)] : null;
    const talle = (p.talles && p.talles.length) ? sizeSelect.value : null;
    const agotado = (p.colores.length || p.talles.length) ? comboAgotado(p, color, talle) : !isInStock(p.stock);
    const stockEl = document.getElementById('modalStock');
    stockEl.textContent = agotado ? 'Agotado' : 'Disponible';
    stockEl.className = 'modal-stock ' + (agotado ? 'out' : 'in');
  }

  function updateModalImage(){
    const p = currentProduct;
    if (!p) return;
    const img = document.getElementById('modalImg');
    let src = p.imagen;
    if (p.colores && p.colores.length && p.imagenescolores && p.imagenescolores.length){
      const i = parseInt(document.getElementById('modalColorSelect').value || 0, 10);
      if (p.imagenescolores[i]) src = p.imagenescolores[i];
    }
    img.src = src || '';
    img.alt = p.nombre || '';
    img.onerror = () => { img.style.display = 'none'; };
    img.onload = () => { img.style.display = 'block'; };
  }

  function sendWhatsappConsulta(){
    const p = currentProduct;
    if (!p) return;
    if (!CONTACTO.whatsapp || CONTACTO.whatsapp.includes('PEGA_AQUI')) return;
    let msg = `Hola! Quería consultar por: ${p.nombre}`;
    if (p.colores && p.colores.length){
      const c = p.colores[parseInt(document.getElementById('modalColorSelect').value, 10)];
      if (c) msg += ` - Color: ${c}`;
    }
    if (p.talles && p.talles.length){
      const t = document.getElementById('modalSizeSelect').value;
      if (t) msg += ` - Talle: ${t}`;
    }
    window.open(`https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function closeDetail(){
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  function openContact(){
    document.getElementById('contactHorario').textContent = CONTACTO.horario || '';
    document.getElementById('contactHorario').style.display = CONTACTO.horario ? 'block' : 'none';

    const emailLink = document.getElementById('contactEmailLink');
    const hasEmail = CONTACTO.email && !CONTACTO.email.includes('PEGA_AQUI');
    emailLink.style.display = hasEmail ? 'flex' : 'none';
    if (hasEmail) emailLink.href = 'mailto:' + CONTACTO.email;

    const waLink = document.getElementById('contactWhatsappLink');
    const hasWa = CONTACTO.whatsapp && !CONTACTO.whatsapp.includes('PEGA_AQUI');
    waLink.style.display = hasWa ? 'flex' : 'none';
    if (hasWa) waLink.href = `https://wa.me/${CONTACTO.whatsapp}`;

    document.getElementById('contactOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeContact(){
    document.getElementById('contactOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape'){ closeDetail(); closeContact(); } });

  function loadCatalog(){
    if (!SHEET_ID || SHEET_ID.includes('PEGA_AQUI')){
      renderState(
        'Falta un paso',
        'Todavía no conectaste tu planilla. Abrí este archivo con el Bloc de notas y pegá el ID de tu Google Sheet donde dice:',
        '<p style="margin-top:10px;"><code>SHEET_ID = "PEGA_AQUI..."</code></p>'
      );
      return;
    }

    const errorState = () => renderState(
      'No pudimos conectar con tu planilla',
      'Revisá estos puntos y volvé a cargar la página (F5):',
      `<ul>
        <li>Que el ID pegado en el código sea exactamente el de tu planilla.</li>
        <li>Que la compartiste como "Cualquier persona con el enlace: Lector".</li>
        <li>Que tengas conexión a internet.</li>
      </ul>`
    );

    let respondido = false;
    const timeout = setTimeout(() => { if (!respondido) errorState(); }, 10000);

    window.handleGvizResponse = function(json){
      respondido = true;
      clearTimeout(timeout);
      try {
        if (!json || json.status === 'error') throw new Error('Planilla no accesible');
        const table = json.table;
        const headers = table.cols.map(c => (c.label || '').trim().toLowerCase());
        const rows = table.rows.map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            if (!h) return;
            const cell = row.c[i];
            const val = cell ? (cell.f ?? cell.v ?? '') : '';
            obj[h] = val.toString().trim();
          });
          return obj;
        }).filter(r => r.nombre);

        allProducts = rows.map(r => {
          const colores = splitList(r.colores);
          const talles = splitList(r.talles);
          return {
            ...r,
            imagen: driveDirectUrl(r.imagen),
            esNuevo: isNuevo(r.nuevo),
            precioAnterior: r.precioanterior || r.precioAnterior || '',
            talles,
            colores,
            imagenescolores: splitPipe(r.imagenescolores),
            sinStock: parseSinStock(r.sinstock, colores, talles)
          };
        });

        if (allProducts.length === 0){
          renderState('El catálogo está vacío', 'Agregá filas a tu planilla con la columna "Nombre" completa y volvé a cargar esta página (F5).');
          return;
        }
        allCategories = [...new Set(allProducts.map(p => p.categoria).filter(Boolean))];
        renderChips(allCategories);
        renderGrid();
      } catch (err){
        errorState();
        console.error('Error cargando el catálogo:', err);
      }
    };

    const prev = document.getElementById('gviz-jsonp');
    if (prev) prev.remove();
    const script = document.createElement('script');
    script.id = 'gviz-jsonp';
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${GID}&tqx=responseHandler:handleGvizResponse`;
    script.onerror = () => { if (!respondido){ respondido = true; clearTimeout(timeout); errorState(); } };
    document.body.appendChild(script);
  }

  const EVENTO_ESPECIAL = {
    activo: true,
    imagen: "https://lh3.googleusercontent.com/d/1WFp3VTGSf1Aa0fa5RDNun6gpMNG6xD2t",
    titulo: "¡11 DE SEPTIEMBRE, DÍA DEL MAESTRO!",
    mensaje: "Consultanos y te preparamos un presente especial",
    fechaLimite: "2026-09-12",
    confeti: true,
    emojisConfeti: ["🎉", "📚", "✨", "📏", "🧮"],
    tipoEfecto: "ambos", 
    coloresConfeti: ["#B8935A", "#C97B84", "#F7E9E6", "#3B2A2E"],
    retrasoBotones: 0,
    promoActivo: true,
    promoCategoria: "15% OFF - Home Deco",
    textoBotonContinuar: "Continuar",
    textoBotonPromo: "Ver promociones"
  };

  function mostrarEventoSiCorresponde(){
    if (!EVENTO_ESPECIAL.activo) return;
    if (EVENTO_ESPECIAL.fechaLimite){
      const limite = new Date(EVENTO_ESPECIAL.fechaLimite + 'T23:59:59');
      if (new Date() > limite) return;
    }
    if (sessionStorage.getItem('eventoCerrado')) return;

    const img = document.getElementById('eventoImg');
    if (EVENTO_ESPECIAL.imagen){ img.src = EVENTO_ESPECIAL.imagen; img.style.display = 'block'; }
    document.getElementById('eventoTitulo').textContent = EVENTO_ESPECIAL.titulo || '';
    document.getElementById('eventoMensaje').textContent = EVENTO_ESPECIAL.mensaje || '';
    document.getElementById('eventoOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (EVENTO_ESPECIAL.confeti) lanzarConfeti();

    const botones = document.getElementById('eventoBotones');
    const btnContinuar = document.getElementById('eventoBtnContinuar');
    const btnPromo = document.getElementById('eventoBtnPromo');
    btnContinuar.textContent = EVENTO_ESPECIAL.textoBotonContinuar || 'Continuar';

    if (EVENTO_ESPECIAL.promoActivo && EVENTO_ESPECIAL.promoCategoria){
      btnPromo.textContent = EVENTO_ESPECIAL.textoBotonPromo || 'Ver promociones';
      btnPromo.style.display = 'flex';
      btnPromo.onclick = (e) => {
        e.preventDefault();
        cerrarEvento();
        activeFilter = EVENTO_ESPECIAL.promoCategoria;
        renderGrid();
        renderChips(allCategories);
      };
    } else {
      btnPromo.style.display = 'none';
    }

    setTimeout(() => { botones.style.display = 'flex'; }, (EVENTO_ESPECIAL.retrasoBotones || 0) * 1000);
  }

  function cerrarEvento(){
    document.getElementById('eventoOverlay').classList.remove('open');
    document.body.style.overflow = '';
    sessionStorage.setItem('eventoCerrado', '1');
  }

function lanzarConfeti(){
  const cont = document.getElementById('eventoConfeti');
  for (let i = 0; i < 60; i++){
    const span = document.createElement('span');
    
    // Si tipoEfecto es 'ambos' o no coincide, decide al azar (50/50) si genera emoji o forma
    const esForma = EVENTO_ESPECIAL.tipoEfecto === 'formas' || 
                    (EVENTO_ESPECIAL.tipoEfecto === 'ambos' && Math.random() > 0.5);

    if (esForma){
      span.className = 'confeti-forma';
      const colores = EVENTO_ESPECIAL.coloresConfeti.length ? EVENTO_ESPECIAL.coloresConfeti : ['#B8935A'];
      span.style.background = colores[Math.floor(Math.random() * colores.length)];
      span.style.borderRadius = ['50%', '4px', '0'][Math.floor(Math.random() * 3)];
      const tam = 8 + Math.random() * 10;
      span.style.width = tam + 'px';
      span.style.height = tam + 'px';
    } else {
      span.className = 'confeti-pieza';
      const emojis = EVENTO_ESPECIAL.emojisConfeti.length ? EVENTO_ESPECIAL.emojisConfeti : ['🎉'];
      span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      span.style.fontSize = (16 + Math.random() * 14) + 'px';
    }

    span.style.left = Math.random() * 100 + 'vw';
    span.style.animationDuration = (2.5 + Math.random() * 2) + 's';
    span.style.animationDelay = (Math.random() * 1.5) + 's';
    cont.appendChild(span);
  }
  setTimeout(() => { cont.innerHTML = ''; }, 5000);
}

  mostrarEventoSiCorresponde();

  searchInput.addEventListener('input', renderGrid);
  loadCatalog();
  setInterval(loadCatalog, 60000);
