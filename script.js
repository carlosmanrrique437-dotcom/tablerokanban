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

// Escuchar base de datos en tiempo real
refTareas.on('value', (snapshot) => {
  tareasActuales = snapshot.val() || {};
  actualizarListasProyectos();
  renderizarTablero();
});

// Autocompletar proyectos en el Select de crear tarea y en el Filtro
function actualizarListasProyectos() {
  const selectCrear = document.getElementById('projectSelect');
  const selectFiltro = document.getElementById('filterProject');
  
  const valorActualCrear = selectCrear.value;
  const valorActualFiltro = selectFiltro.value;

  const proyectos = new Set();
  Object.values(tareasActuales).forEach(t => {
    if(t.proyecto && t.proyecto.trim() !== "") proyectos.add(t.proyecto);
  });

  // Reconstruir el selector de crear tarea
  selectCrear.innerHTML = '<option value="">-- Seleccionar Proyecto --</option>';
  proyectos.forEach(proj => {
    selectCrear.innerHTML += `<option value="${proj}">${proj}</option>`;
  });
  selectCrear.innerHTML += '<option value="NUEVO">+ Crear Nuevo Proyecto...</option>';

  // Reconstruir el selector de filtros
  selectFiltro.innerHTML = '<option value="todos">Todos los proyectos</option>';
  proyectos.forEach(proj => {
    selectFiltro.innerHTML += `<option value="${proj}">${proj}</option>`;
  });

  // Mantener la selección si aún existe
  if (valorActualCrear !== "NUEVO" && valorActualCrear !== "") selectCrear.value = valorActualCrear;
  selectFiltro.value = valorActualFiltro;
}

// Mostrar input de texto si eligen "Nuevo Proyecto"
function verificarNuevoProyecto() {
  const select = document.getElementById('projectSelect');
  const inputNuevo = document.getElementById('newProjectInput');
  if (select.value === 'NUEVO') {
    inputNuevo.style.display = 'block';
  } else {
    inputNuevo.style.display = 'none';
    inputNuevo.value = '';
  }
}

// Dibujar el tablero
function renderizarTablero() {
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  
  const filtroPrioridad = document.getElementById('filterPriority').value;
  const filtroProyecto = document.getElementById('filterProject').value;

  // Ordenar tareas usando la propiedad "orden" numérica que pidió el usuario
  const arrayTareas = Object.keys(tareasActuales).map(id => ({
    id,
    ...tareasActuales[id]
  })).sort((a, b) => (a.orden || 999999) - (b.orden || 999999));

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

// Generador de colores para proyectos
function generarColorProyecto(nombre) {
  if(!nombre) return '#6c757d'; 
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 35%)`; 
}

// Crear la tarjeta HTML
function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  if (!columna) return;
  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;

  // Solo arrastramos para cambiar de columna
  card.ondragstart = (e) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Etiqueta del proyecto
  const badge = document.createElement('div');
  badge.className = 'project-badge';
  badge.innerText = tarea.proyecto || 'General';
  badge.style.backgroundColor = generarColorProyecto(tarea.proyecto);

  // Etiqueta de la posición (Número)
  const ordenTexto = document.createElement('div');
  ordenTexto.className = 'order-badge';
  ordenTexto.innerText = `Posición: ${tarea.orden || '-'}`;

  const content = document.createElement('div');
  content.className = 'card-content';

  const titulo = document.createElement('span');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  const acciones = document.createElement('div');
  acciones.className = 'card-actions';

  const btnEditar = document.createElement('button');
  btnEditar.innerText = '✏️';
  btnEditar.onclick = () => abrirModalEdicion(id); // Abre la ventana emergente

  const btnEliminar = document.createElement('button');
  btnEliminar.innerText = '🗑️';
  btnEliminar.onclick = () => eliminarTarea(id);

  acciones.appendChild(btnEditar);
  acciones.appendChild(btnEliminar);
  content.appendChild(titulo);
  content.appendChild(acciones);

  card.appendChild(badge);
  card.appendChild(ordenTexto);
  card.appendChild(content);
  container.appendChild(card);
}

// ---- LÓGICA DE VENTANA EMERGENTE (MODAL) PARA EDITAR ----
function abrirModalEdicion(id) {
  const tarea = tareasActuales[id];
  if (!tarea) return;

  // Llenar el formulario con los datos actuales
  document.getElementById('editTaskId').value = id;
  document.getElementById('editTaskTitle').value = tarea.titulo;
  document.getElementById('editTaskProject').value = tarea.proyecto || '';
  document.getElementById('editTaskPriority').value = tarea.prioridad;
  document.getElementById('editTaskOrder').value = tarea.orden || '';

  // Mostrar la ventana
  document.getElementById('editModal').style.display = 'block';
}

function cerrarModal() {
  document.getElementById('editModal').style.display = 'none';
}

function guardarEdicion() {
  const id = document.getElementById('editTaskId').value;
  const nuevoTitulo = document.getElementById('editTaskTitle').value.trim();
  const nuevoProyecto = document.getElementById('editTaskProject').value.trim();
  const nuevaPrioridad = document.getElementById('editTaskPriority').value;
  const nuevoOrden = parseInt(document.getElementById('editTaskOrder').value);

  if (nuevoTitulo === '') {
    alert("El título no puede estar vacío");
    return;
  }

  // Actualizar en Firebase
  db.ref(`tareas/${id}`).update({ 
    titulo: nuevoTitulo,
    proyecto: nuevoProyecto,
    prioridad: nuevaPrioridad,
    orden: isNaN(nuevoOrden) ? 999999 : nuevoOrden // Si no ponen número, se va al final
  });

  cerrarModal();
}

// ---- LOGICA PARA MOVER ENTRE COLUMNAS ----
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.closest('.column').id;
  
  // Solo cambiamos la columna. El orden numérico se mantiene.
  db.ref(`tareas/${idTarea}/columna`).set(columnaDestino);
}

// ---- CREAR NUEVA TAREA ----
function agregarTarea() {
  const input = document.getElementById('taskInput');
  const selectProj = document.getElementById('projectSelect');
  const inputNuevoProj = document.getElementById('newProjectInput');
  const prioridad = document.getElementById('prioritySelect').value;
  
  const texto = input.value.trim();
  
  // Determinar si usamos el proyecto del select o el que escribieron a mano
  let proyecto = selectProj.value;
  if (proyecto === 'NUEVO') {
    proyecto = inputNuevoProj.value.trim();
  }
  if (proyecto === '') proyecto = 'General';

  if (texto === '') return;

  // Asignamos fecha actual como orden base para que queden de últimas al crearse
  db.ref('tareas').push({
    titulo: texto,
    proyecto: proyecto,
    prioridad: prioridad,
    columna: 'backlog',
    orden: Date.now() 
  });

  input.value = '';
}
