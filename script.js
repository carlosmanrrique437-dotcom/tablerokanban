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
const refFases = db.ref('fases');

let tareasActuales = {}; 
let proyectosGlobales = []; 
let fasesGlobales = {}; 
let fasesPorProyecto = {}; 

refProyectos.on('value', (snap) => {
  proyectosGlobales = snap.val() ? Object.keys(snap.val()) : [];
  actualizarListasProyectos();
});

refFases.on('value', (snap) => {
  fasesGlobales = snap.val() || {};
  actualizarListasProyectos();
});

refTareas.on('value', (snap) => {
  tareasActuales = snap.val() || {};
  actualizarListasProyectos();
  renderizarTablero();
});

function syncScroll(source) {
  const top = document.getElementById('topScrollWrapper');
  const bottom = document.getElementById('kanbanBoard');
  if(source === 'top') bottom.scrollLeft = top.scrollLeft;
  if(source === 'bottom') top.scrollLeft = bottom.scrollLeft;
}

function updateTopScrollWidth() {
  const board = document.getElementById('kanbanBoard');
  const topContent = document.getElementById('topScrollContent');
  if(board && topContent) topContent.style.width = board.scrollWidth + 'px';
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

  fasesPorProyecto = {};
  proyectosUnicos.forEach(p => fasesPorProyecto[p] = new Set());
  fasesPorProyecto['General'] = new Set();

  for(let p in fasesGlobales) {
      if(!fasesPorProyecto[p]) fasesPorProyecto[p] = new Set();
      Object.keys(fasesGlobales[p]).forEach(f => fasesPorProyecto[p].add(f));
  }
  Object.values(tareasActuales).forEach(t => {
      let p = t.proyecto || 'General';
      if(t.fase && t.fase.trim() !== '') {
          if(!fasesPorProyecto[p]) fasesPorProyecto[p] = new Set();
          fasesPorProyecto[p].add(t.fase);
      }
  });

  selectCrear.innerHTML = '<option value="">-- Proyecto (General) --</option>';
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
  
  actualizarFases('crear');
  actualizarFiltroFases();
}

function actualizarFases(modo) {
  const selectProj = document.getElementById(modo === 'crear' ? 'projectSelect' : 'editTaskProject');
  const selectFase = document.getElementById(modo === 'crear' ? 'phaseSelect' : 'editTaskPhase');
  const inputNuevoProj = document.getElementById(modo === 'crear' ? 'newProjectInput' : null);
  
  let proyecto = selectProj.value;
  if(proyecto === 'NUEVO' && inputNuevoProj) proyecto = inputNuevoProj.value.trim();
  if(proyecto === '') proyecto = 'General';

  const valorAnterior = selectFase.value;
  selectFase.innerHTML = '<option value="">-- Sin Fase --</option>';
  
  if(fasesPorProyecto[proyecto]) {
    fasesPorProyecto[proyecto].forEach(f => {
       selectFase.innerHTML += `<option value="${f}">${f}</option>`;
    });
  }
  selectFase.innerHTML += '<option value="NUEVA">+ Crear Nueva Fase...</option>';
  
  selectFase.value = valorAnterior;
  if(selectFase.selectedIndex === -1) selectFase.value = "";
  
  if(modo === 'crear') actualizarBoton();
}

function actualizarFiltroFases() {
  const proy = document.getElementById('filterProject').value;
  const selectFilterFase = document.getElementById('filterPhase');
  const valorFase = selectFilterFase.value;

  selectFilterFase.innerHTML = '<option value="todas">Todas las fases</option>';
  
  if (proy !== 'todos' && fasesPorProyecto[proy]) {
    fasesPorProyecto[proy].forEach(f => {
        selectFilterFase.innerHTML += `<option value="${f}">${f}</option>`;
    });
  }
  
  selectFilterFase.value = valorFase;
  if(selectFilterFase.selectedIndex === -1) selectFilterFase.value = "todas";
  
  aplicarFiltro();
}

function actualizarBoton() {
  const select = document.getElementById('projectSelect');
  const inputNuevo = document.getElementById('newProjectInput');
  const selectFase = document.getElementById('phaseSelect');
  const inputNuevaFase = document.getElementById('newPhaseInput');
  const btn = document.getElementById('btnPrincipal');
  const inputTarea = document.getElementById('taskInput').value.trim();
  
  inputNuevo.style.display = (select.value === 'NUEVO') ? 'inline-block' : 'none';
  if (select.value !== 'NUEVO') inputNuevo.value = '';

  inputNuevaFase.style.display = (selectFase.value === 'NUEVA') ? 'inline-block' : 'none';
  if (selectFase.value !== 'NUEVA') inputNuevaFase.value = '';

  if (select.value === 'NUEVO' && inputTarea === '') {
    btn.innerText = 'Guardar Proyecto';
  } else if (selectFase.value === 'NUEVA' && inputTarea === '') {
    btn.innerText = 'Guardar Fase';
  } else {
    btn.innerText = 'Agregar Tarea';
  }
}

function agregarAlTablero() {
  const inputTarea = document.getElementById('taskInput');
  const selectProj = document.getElementById('projectSelect');
  const inputNuevoProj = document.getElementById('newProjectInput');
  const selectFase = document.getElementById('phaseSelect');
  const inputNuevaFase = document.getElementById('newPhaseInput');
  const prioridad = document.getElementById('prioritySelect').value;
  
  const textoTarea = inputTarea.value.trim();
  
  let proyecto = selectProj.value;
  if (proyecto === 'NUEVO') {
    proyecto = inputNuevoProj.value.trim();
    if (proyecto !== '') db.ref(`proyectos/${proyecto}`).set(true); 
  }
  if (proyecto === '') proyecto = 'General';

  let fase = selectFase.value;
  if (fase === 'NUEVA') {
    fase = inputNuevaFase.value.trim();
    if (fase !== '') db.ref(`fases/${proyecto}/${fase}`).set(true);
  }
  if (fase === 'NUEVA') fase = '';

  if (textoTarea === '') {
    if (selectProj.value === 'NUEVO' && proyecto !== 'General' && proyecto !== '') {
      alert(`¡Proyecto "${proyecto}" agregado!`);
    } else if (selectFase.value === 'NUEVA' && fase !== '') {
      alert(`¡Fase "${fase}" agregada al proyecto ${proyecto}!`);
    } else {
      alert("Escribe el nombre de la tarea que vas a crear.");
      return;
    }
    inputNuevoProj.style.display = 'none';
    inputNuevaFase.style.display = 'none';
    selectProj.value = proyecto;
    actualizarFases('crear');
    document.getElementById('phaseSelect').value = fase;
    actualizarBoton();
    return;
  }

  let maxOrden = 0;
  Object.values(tareasActuales).forEach(t => {
    if (t.columna === 'backlog' && t.orden && t.orden < 1000000) maxOrden = Math.max(maxOrden, parseInt(t.orden));
  });

  db.ref('tareas').push({
    titulo: textoTarea,
    proyecto: proyecto,
    fase: fase,
    prioridad: prioridad,
    columna: 'backlog',
    orden: maxOrden + 1,
    responsable: "" 
  }).then(() => {
    inputTarea.value = '';
    actualizarBoton();
  });
}

function renderizarTablero() {
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  
  const filtroPrioridad = document.getElementById('filterPriority').value;
  const filtroProyecto = document.getElementById('filterProject').value;
  const filtroFase = document.getElementById('filterPhase').value;

  const arrayTareas = Object.keys(tareasActuales).map(id => ({
    id, ...tareasActuales[id]
  })).sort((a, b) => (a.orden || 999999) - (b.orden || 999999));

  arrayTareas.forEach(tarea => {
    const pasaPrioridad = filtroPrioridad === 'todas' || tarea.prioridad === filtroPrioridad;
    const pasaProyecto = filtroProyecto === 'todos' || tarea.proyecto === filtroProyecto;
    const pasaFase = filtroFase === 'todas' || tarea.fase === filtroFase;

    if (pasaPrioridad && pasaProyecto && pasaFase) renderizarTarjeta(tarea.id, tarea);
  });
  
  setTimeout(updateTopScrollWidth, 100); 
}

function aplicarFiltro() {
  const filtroProyecto = document.getElementById('filterProject').value;
  const btnEliminarProyecto = document.getElementById('btnEliminarProyecto');
  btnEliminarProyecto.style.display = (filtroProyecto !== 'todos' && filtroProyecto !== 'General') ? 'inline-block' : 'none';
  renderizarTablero(); 
}

function eliminarProyectoSeleccionado() {
  const proyecto = document.getElementById('filterProject').value;
  if(proyecto === 'todos' || proyecto === 'General') return;
  if(confirm(`¿Estás seguro de eliminar el proyecto "${proyecto}"?\nSus fases también se borrarán, pero las tareas quedarán huérfanas en "General".`)) {
    db.ref(`proyectos/${proyecto}`).remove();
    db.ref(`fases/${proyecto}`).remove();
    document.getElementById('filterProject').value = 'todos'; 
    actualizarFiltroFases();
  }
}

// ESTA ES LA FUNCIÓN QUE GENERA LOS COLORES AUTOMÁTICOS
function generarColorProyecto(nombre) {
  if(!nombre || nombre === 'General') return '#6c757d'; 
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  // Ajuste leve de brillo (40%) para colores vivos pero que permitan leer la letra blanca
  return `hsl(${Math.abs(hash) % 360}, 75%, 40%)`; 
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
  
  let textoBadge = tarea.proyecto || 'General';
  if(tarea.fase && tarea.fase.trim() !== '') textoBadge += ` | ${tarea.fase}`;
  badge.innerText = textoBadge;
  // Llama a la función automática de colores
  badge.style.backgroundColor = generarColorProyecto(tarea.proyecto);

  const ordenTexto = document.createElement('div');
  ordenTexto.className = 'order-badge';
  ordenTexto.innerText = `Posición: ${(tarea.orden && tarea.orden < 1000000) ? tarea.orden : '-'}`;

  const content = document.createElement('div');
  content.className = 'card-content';

  const mainInfo = document.createElement('div');
  mainInfo.className = 'card-main-info';

  const titulo = document.createElement('div');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  const responsable = document.createElement('div');
  responsable.className = 'responsable-badge';
  responsable.innerHTML = tarea.responsable ? `👤 ${tarea.responsable}` : '👤 Sin asignar';

  mainInfo.appendChild(titulo);
  mainInfo.appendChild(responsable);

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
  
  content.appendChild(mainInfo);
  content.appendChild(acciones);

  card.appendChild(badge);
  card.appendChild(ordenTexto);
  card.appendChild(content);
  container.appendChild(card);
}

function verificarNuevaFaseEdicion() {
  const select = document.getElementById('editTaskPhase');
  const input = document.getElementById('newEditPhaseInput');
  input.style.display = (select.value === 'NUEVA') ? 'block' : 'none';
  if(select.value !== 'NUEVA') input.value = '';
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
  
  actualizarFases('editar'); 
  const selectFaseModal = document.getElementById('editTaskPhase');
  if(selectFaseModal.querySelector(`option[value="${tarea.fase}"]`)) {
    selectFaseModal.value = tarea.fase || '';
  }
  verificarNuevaFaseEdicion();

  document.getElementById('editTaskPriority').value = tarea.prioridad;
  document.getElementById('editTaskResponsable').value = tarea.responsable || '';
  document.getElementById('editTaskOrder').value = (tarea.orden && tarea.orden < 1000000) ? tarea.orden : '';

  document.getElementById('editModal').style.display = 'block';
}

function cerrarModal() { document.getElementById('editModal').style.display = 'none'; }

function guardarEdicion() {
  const id = document.getElementById('editTaskId').value;
  const nuevoTitulo = document.getElementById('editTaskTitle').value.trim();
  const nuevoProyecto = document.getElementById('editTaskProject').value;
  const nuevaPrioridad = document.getElementById('editTaskPriority').value;
  const nuevoResponsable = document.getElementById('editTaskResponsable').value.trim();
  const nuevoOrden = parseInt(document.getElementById('editTaskOrder').value);
  
  let nuevaFase = document.getElementById('editTaskPhase').value;
  if(nuevaFase === 'NUEVA') {
    nuevaFase = document.getElementById('newEditPhaseInput').value.trim();
    if(nuevaFase !== '') db.ref(`fases/${nuevoProyecto}/${nuevaFase}`).set(true);
  }
  if(nuevaFase === 'NUEVA') nuevaFase = '';

  if (nuevoTitulo === '') { alert("El título no puede estar vacío"); return; }

  db.ref(`tareas/${id}`).update({ 
    titulo: nuevoTitulo,
    proyecto: nuevoProyecto,
    fase: nuevaFase,
    prioridad: nuevaPrioridad,
    responsable: nuevoResponsable,
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
