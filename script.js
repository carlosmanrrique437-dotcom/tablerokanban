// Configuración exacta de tu proyecto en Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAygIAdszR5PrG6V7aEF3b5r11lpeiKYAE",
  authDomain: "tablero-kanban12345.firebaseapp.com",
  databaseURL: "https://tablero-kanban12345-default-rtdb.firebaseio.com",
  projectId: "tablero-kanban12345",
  storageBucket: "tablero-kanban12345.firebasestorage.app",
  messagingSenderId: "82372307045",
  appId: "1:82372307045:web:1a105e2c78a8336421fe8c",
  measurementId: "G-VC1RV4ML7K"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refTareas = db.ref('tareas');

let tareasActuales = {}; 

// Escuchar base de datos
refTareas.on('value', (snapshot) => {
  tareasActuales = snapshot.val() || {};
  actualizarListasProyectos();
  renderizarTablero();
});

// Autocompletar proyectos y llenar el filtro
function actualizarListasProyectos() {
  const select = document.getElementById('filterProject');
  const datalist = document.getElementById('listaProyectos');
  const valorActual = select.value;

  const proyectos = new Set();
  Object.values(tareasActuales).forEach(t => {
    if(t.proyecto) proyectos.add(t.proyecto);
  });

  select.innerHTML = '<option value="todos">Todos los proyectos</option>';
  datalist.innerHTML = '';

  proyectos.forEach(proj => {
    // Opción para el filtro
    const optFiltro = document.createElement('option');
    optFiltro.value = proj;
    optFiltro.innerText = proj;
    select.appendChild(optFiltro);

    // Opción para autocompletar al crear
    const optData = document.createElement('option');
    optData.value = proj;
    datalist.appendChild(optData);
  });

  if (proyectos.has(valorActual)) select.value = valorActual;
}

function renderizarTablero() {
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  
  const filtroPrioridad = document.getElementById('filterPriority').value;
  const filtroProyecto = document.getElementById('filterProject').value;

  // Convertimos a array y ordenamos por el número de orden
  const arrayTareas = Object.keys(tareasActuales).map(id => ({
    id,
    ...tareasActuales[id]
  })).sort((a, b) => (a.orden || 0) - (b.orden || 0));

  arrayTareas.forEach(tarea => {
    const pasaPrioridad = filtroPrioridad === 'todas' || tarea.prioridad === filtroPrioridad;
    const pasaProyecto = filtroProyecto === 'todos' || tarea.proyecto === filtroProyecto;

    if (pasaPrioridad && pasaProyecto) {
      renderizarTarjeta(tarea.id, tarea);
    }
  });
}

function aplicarFiltro() {
  renderizarTablero();
}

// Generador de colores únicos para cada proyecto
function generarColorProyecto(nombre) {
  if(!nombre) return '#6c757d'; 
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 40%)`; // Color oscuro para que la letra blanca se lea bien
}

function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  if (!columna) return;
  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;

  // Eventos de arrastrar
  card.ondragstart = (e) => {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
  };
  card.ondragend = () => card.classList.remove('dragging');

  // Etiqueta del proyecto
  const badge = document.createElement('div');
  badge.className = 'project-badge';
  badge.innerText = tarea.proyecto || 'General';
  badge.style.backgroundColor = generarColorProyecto(tarea.proyecto || 'General');

  // Contenido de la tarjeta (Titulo y Botones)
  const content = document.createElement('div');
  content.className = 'card-content';

  const titulo = document.createElement('span');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  const acciones = document.createElement('div');
  acciones.className = 'card-actions';

  const btnEditar = document.createElement('button');
  btnEditar.innerText = '✏️';
  btnEditar.onclick = () => editarTarea(id, tarea.titulo);

  const btnEliminar = document.createElement('button');
  btnEliminar.innerText = '🗑️';
  btnEliminar.onclick = () => eliminarTarea(id);

  acciones.appendChild(btnEditar);
  acciones.appendChild(btnEliminar);
  content.appendChild(titulo);
  content.appendChild(acciones);

  card.appendChild(badge);
  card.appendChild(content);
  container.appendChild(card);
}

// ---- LOGICA PARA ARRASTRAR Y ORDENAR EN EL MEDIO ----
function allowDrop(ev) {
  ev.preventDefault();
  const columna = ev.currentTarget.closest('.column');
  const container = columna.querySelector('.cards-container');
  const draggingCard = document.querySelector('.dragging');
  if (!draggingCard) return;

  const afterElement = obtenerElementoSiguiente(container, ev.clientY);
  if (afterElement == null) {
    container.appendChild(draggingCard);
  } else {
    container.insertBefore(draggingCard, afterElement);
  }
}

// Calcula en qué posición del mouse estás soltando la tarjeta
function obtenerElementoSiguiente(container, y) {
  const elementos = [...container.querySelectorAll('.card:not(.dragging)')];
  return elementos.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.closest('.column').id;
  const container = document.getElementById(columnaDestino).querySelector('.cards-container');
  
  // Guardamos el nuevo orden de TODAS las tarjetas de esta columna en Firebase
  const cards = [...container.querySelectorAll('.card')];
  let actualizaciones = {};
  
  cards.forEach((card, index) => {
    actualizaciones[`tareas/${card.id}/columna`] = columnaDestino;
    actualizaciones[`tareas/${card.id}/orden`] = index;
  });

  db.ref().update(actualizaciones);
}

// ---- LOGICA DE TAREAS ----
function eliminarTarea(id) {
  if (confirm('¿Eliminar esta tarea del tablero?')) db.ref(`tareas/${id}`).remove();
}

function editarTarea(id, tituloActual) {
  const nuevoTitulo = prompt('Nuevo nombre:', tituloActual);
  if (nuevoTitulo && nuevoTitulo.trim() !== '') db.ref(`tareas/${id}`).update({ titulo: nuevoTitulo.trim() });
}

function agregarTarea() {
  const input = document.getElementById('taskInput');
  const projectInput = document.getElementById('projectInput');
  const prioridad = document.getElementById('prioritySelect').value;
  
  const texto = input.value.trim();
  const proyecto = projectInput.value.trim() || 'General';

  if (texto === '') return;

  db.ref('tareas').push({
    titulo: texto,
    proyecto: proyecto,
    prioridad: prioridad,
    columna: 'backlog',
    orden: Date.now() // Va al final por defecto
  });

  input.value = '';
  // No limpiamos el proyecto para que sea fácil seguir agregando tareas a ese mismo proyecto
}
