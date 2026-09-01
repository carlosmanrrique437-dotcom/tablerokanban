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
const refProyectos = db.ref('proyectos'); 

let tareasActuales = {}; 
let proyectosGlobales = []; 

// Escuchar cambios
refProyectos.on('value', (snapshot) => {
  proyectosGlobales = snapshot.val() ? Object.keys(snapshot.val()) : [];
  actualizarListasProyectos();
});

refTareas.on('value', (snapshot) => {
  tareasActuales = snapshot.val() || {};
  actualizarListasProyectos();
  renderizarTablero();
});

// Sincronizar las barras de scroll (Superior e Inferior)
function syncScroll(source) {
  const top = document.getElementById('topScrollWrapper');
  const bottom = document.getElementById('kanbanBoard');
  if(source === 'top') bottom.scrollLeft = top.scrollLeft;
  if(source === 'bottom') top.scrollLeft = bottom.scrollLeft;
}

function updateTopScrollWidth() {
  const board = document.getElementById('kanbanBoard');
  const topContent = document.getElementById('topScrollContent');
  if(board && topContent) {
    topContent.style.width = board.scrollWidth + 'px';
  }
}

function actualizarListasProyectos() {
  const selectCrear = document.getElementById('projectSelect');
  const selectFiltro = document.getElementById('filterProject');
  const selectEditar = document.getElementById('editTaskProject'); 
  
  const valorActualCrear = selectCrear.value;
  const valorActualFiltro = selectFiltro.value;

  const proyectosUnicos = new Set(proyectosGlobales);
  Object.values(tareasActuales).forEach(t => {
    if(t.proyecto && t.proyecto !== 'General' && t.proyecto.trim() !== "") proyectosUnicos.add(t.proyecto);
  });

  selectCrear.innerHTML = '<option value="">-- Seleccionar Proyecto --</option>';
  proyectosUnicos.forEach(proj => { selectCrear.innerHTML += `<option value="${proj}">${proj}</option>`; });
  selectCrear.innerHTML += '<option value="NUEVO">+ Crear Nuevo Proyecto...</option>';

  selectFiltro.innerHTML = '<option value="todos">Todos los proyectos</option>';
  proyectosUnicos.forEach(proj => { selectFiltro.innerHTML += `<option value="${proj}">${proj}</option>`; });

  if(selectEditar) {
    selectEditar.innerHTML = '<option value="General">General</option>';
    proyectosUnicos.forEach(proj => { selectEditar.innerHTML += `<option value="${proj}">${proj}</option>`; });
  }

  if (valorActualCrear !== "NUEVO" && valorActualCrear !== "") selectCrear.value = valorActualCrear;
  selectFiltro.value = valorActualFiltro;
  
  aplicarFiltro(); // Actualizar visibilidad del botón eliminar proyecto
}

// Controla qué texto y campos se ven según lo que quieres hacer
function actualizarBoton() {
  const select = document.getElementById('projectSelect');
  const inputNuevo = document.getElementById('newProjectInput');
  const btn = document.getElementById('btnPrincipal');
  const inputTarea = document.getElementById('taskInput').value.trim();
  
  if (select.value === 'NUEVO') {
    inputNuevo.style.display = 'inline-block';
  } else {
    inputNuevo.style.display = 'none';
    inputNuevo.value = '';
  }

  if (select.value === 'NUEVO' && inputTarea === '') {
    btn.innerText = 'Agregar Proyecto';
    btn.style.backgroundColor = '#28a745'; // Verde
  } else {
    btn.innerText = 'Agregar Tarea';
    btn.style.backgroundColor = '#0b2240'; // Azul
  }
}

function agregarAlTablero() {
  const inputTarea = document.getElementById('taskInput');
  const selectProj = document.getElementById('projectSelect');
  const inputNuevoProj = document.getElementById('newProjectInput');
  const prioridad = document.getElementById('prioritySelect').value;
  
  const textoTarea = inputTarea.value.trim();
  let proyecto = selectProj.value;

  if (proyecto === 'NUEVO') {
    proyecto = inputNuevoProj.value.trim();
    if (proyecto === '') {
      alert("Por favor escribe el nombre del nuevo proyecto.");
      return;
    }
    db.ref(`proyectos/${proyecto}`).set(true); 
  }

  if (proyecto === '') proyecto = 'General';

  if (textoTarea === '') {
    if (selectProj.value === 'NUEVO') {
      alert(`¡Proyecto "${proyecto}" agregado correctamente!`);
      inputNuevoProj.style.display = 'none';
      inputNuevoProj.value = '';
      selectProj.value = proyecto;
      actualizarBoton();
    } else {
      alert("Escribe el nombre de la tarea que vas a crear.");
    }
    return;
  }

  // Generar un número de orden limpio (1, 2, 3...)
  let maxOrden = 0;
  Object.values(tareasActuales).forEach(t => {
    if (t.columna === 'backlog' && t.orden && t.orden < 1000000) {
      maxOrden = Math.max(maxOrden, parseInt(t.orden));
    }
  });

  db.ref('tareas').push({
    titulo: textoTarea,
    proyecto: proyecto,
    prioridad: prioridad,
    columna: 'backlog',
    orden: maxOrden + 1
  }).then(() => {
    inputTarea.value = '';
    actualizarBoton();
  }).catch(() => {
    alert("Error de conexión. Revisa los permisos de Firebase.");
  });
}

function renderizarTablero() {
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  
  const filtroPrioridad = document.getElementById('filterPriority').value;
  const filtroProyecto = document.getElementById('filterProject').value;

  const arrayTareas = Object.keys(tareasActuales).map(id => ({
    id,
    ...tareasActuales[id]
  })).sort((a, b) => (a.orden || 999999) - (b.orden || 999999));

  arrayTareas.forEach(tarea => {
    const pasaPrioridad = filtroPrioridad === 'todas' || tarea.prioridad === filtroPrioridad;
    const pasaProyecto = filtroProyecto === 'todos' || tarea.proyecto === filtroProyecto;

    if (pasaPrioridad && pasaProyecto) renderizarTarjeta(tarea.id, tarea);
  });
  
  setTimeout(updateTopScrollWidth, 100); // Ajusta el scroll de arriba
}

function aplicarFiltro() {
  const filtroProyecto = document.getElementById('filterProject').value;
  const btnEliminarProyecto = document.getElementById('btnEliminarProyecto');
  
  // Mostrar botón de eliminar solo si hay un proyecto específico seleccionado
  if (filtroProyecto !== 'todos' && filtroProyecto !== 'General') {
    btnEliminarProyecto.style.display = 'inline-block';
  } else {
    btnEliminarProyecto.style.display = 'none';
  }
  
  renderizarTablero(); 
}

function eliminarProyectoSeleccionado() {
  const proyecto = document.getElementById('filterProject').value;
  if(proyecto === 'todos' || proyecto === 'General') return;
  
  if(confirm(`¿Estás seguro de eliminar el proyecto "${proyecto}"?\nLas tareas asociadas no se borrarán, pero quedarán sin proyecto.`)) {
    db.ref(`proyectos/${proyecto}`).remove();
    alert(`Proyecto ${proyecto} eliminado.`);
    document.getElementById('filterProject').value = 'todos'; // Resetear filtro
    aplicarFiltro();
  }
}

function generarColorProyecto(nombre) {
  if(!nombre || nombre === 'General') return '#6c757d'; 
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 70%, 35%)`; 
}

function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  if (!columna) return;
  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;

  card.ondragstart = (e) => { e.dataTransfer.setData('text/plain', id); };

  const badge = document.createElement('div');
  badge.className = 'project-badge';
  badge.innerText = tarea.proyecto || 'General';
  badge.style.backgroundColor = generarColorProyecto(tarea.proyecto);

  const ordenTexto = document.createElement('div');
  ordenTexto.className = 'order-badge';
  // Ocultamos el número gigante si es un registro viejo
  const numMostrar = (tarea.orden && tarea.orden < 1000000) ? tarea.orden : '-';
  ordenTexto.innerText = `Posición: ${numMostrar}`;

  const content = document.createElement('div');
  content.className = 'card-content';

  const titulo = document.createElement('span');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  const acciones = document.createElement('div');
  acciones.className = 'card-actions';

  const btnEditar = document.createElement('button');
  btnEditar.innerText = '✏️';
  btnEditar.onclick = () => abrirModalEdicion(id);

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

function abrirModalEdicion(id) {
  const tarea = tareasActuales[id];
  if (!tarea) return;

  document.getElementById('editTaskId').value = id;
  document.getElementById('editTaskTitle').value = tarea.titulo;
  
  const selectProyectoModal = document.getElementById('editTaskProject');
  if(selectProyectoModal.querySelector(`option[value="${tarea.proyecto}"]`)) {
    selectProyectoModal.value = tarea.proyecto || 'General';
  }

  document.getElementById('editTaskPriority').value = tarea.prioridad;
  
  // Limpiamos el número gigante en el modal para que le ponga uno nuevo
  const numFormulario = (tarea.orden && tarea.orden < 1000000) ? tarea.orden : '';
  document.getElementById('editTaskOrder').value = numFormulario;

  document.getElementById('editModal').style.display = 'block';
}

function cerrarModal() { document.getElementById('editModal').style.display = 'none'; }

function guardarEdicion() {
  const id = document.getElementById('editTaskId').value;
  const nuevoTitulo = document.getElementById('editTaskTitle').value.trim();
  const nuevoProyecto = document.getElementById('editTaskProject').value;
  const nuevaPrioridad = document.getElementById('editTaskPriority').value;
  const nuevoOrden = parseInt(document.getElementById('editTaskOrder').value);

  if (nuevoTitulo === '') { alert("El título no puede estar vacío"); return; }

  db.ref(`tareas/${id}`).update({ 
    titulo: nuevoTitulo,
    proyecto: nuevoProyecto,
    prioridad: nuevaPrioridad,
    orden: isNaN(nuevoOrden) ? 999999 : nuevoOrden
  });

  cerrarModal();
}

function allowDrop(ev) { ev.preventDefault(); }
function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.closest('.column').id;
  db.ref(`tareas/${idTarea}/columna`).set(columnaDestino);
}
function eliminarTarea(id) {
  if (confirm('¿Eliminar esta tarea del tablero?')) db.ref(`tareas/${id}`).remove();
}
