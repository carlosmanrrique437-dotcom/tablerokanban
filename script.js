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
let proyectosData = {}; // Guardaremos los colores aquí
let fasesGlobales = {}; 
let fasesPorProyecto = {}; 

refProyectos.on('value', (snapshot) => {
  if (snapshot.val()) {
    proyectosData = snapshot.val();
    proyectosGlobales = Object.keys(proyectosData);
  } else {
    proyectosData = {};
    proyectosGlobales = [];
  }
  actualizarListasProyectos();
});

refFases.on('value', (snapshot) => {
  if (snapshot.val()) {
    fasesGlobales = snapshot.val();
  } else {
    fasesGlobales = {};
  }
  actualizarListasProyectos();
});

refTareas.on('value', (snapshot) => {
  if (snapshot.val()) {
    tareasActuales = snapshot.val();
  } else {
    tareasActuales = {};
  }
  actualizarListasProyectos();
  renderizarTablero();
});

function syncScroll(source) {
  const top = document.getElementById('topScrollWrapper');
  const bottom = document.getElementById('kanbanBoard');
  
  if (source === 'top') {
    bottom.scrollLeft = top.scrollLeft;
  }
  if (source === 'bottom') {
    top.scrollLeft = bottom.scrollLeft;
  }
}

function updateTopScrollWidth() {
  const board = document.getElementById('kanbanBoard');
  const topContent = document.getElementById('topScrollContent');
  
  if (board && topContent) {
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
    if (t.proyecto && t.proyecto !== 'General' && t.proyecto.trim() !== "") {
      proyectosUnicos.add(t.proyecto);
    }
  });

  fasesPorProyecto = {};
  proyectosUnicos.forEach(p => {
    fasesPorProyecto[p] = new Set();
  });
  fasesPorProyecto['General'] = new Set();

  for (let p in fasesGlobales) {
    if (!fasesPorProyecto[p]) {
      fasesPorProyecto[p] = new Set();
    }
    Object.keys(fasesGlobales[p]).forEach(f => {
      fasesPorProyecto[p].add(f);
    });
  }
  
  Object.values(tareasActuales).forEach(t => {
    let p = t.proyecto || 'General';
    if (t.fase && t.fase.trim() !== '') {
      if (!fasesPorProyecto[p]) {
        fasesPorProyecto[p] = new Set();
      }
      fasesPorProyecto[p].add(t.fase);
    }
  });

  selectCrear.innerHTML = '<option value="">-- Proyecto (General) --</option>';
  proyectosUnicos.forEach(proj => { 
    selectCrear.innerHTML += `<option value="${proj}">${proj}</option>`; 
  });
  selectCrear.innerHTML += '<option value="NUEVO">+ Crear Nuevo Proyecto...</option>';

  selectFiltro.innerHTML = '<option value="todos">Todos los proyectos</option>';
  proyectosUnicos.forEach(proj => { 
    selectFiltro.innerHTML += `<option value="${proj}">${proj}</option>`; 
  });

  if (selectEditar) {
    selectEditar.innerHTML = '<option value="General">General</option>';
    proyectosUnicos.forEach(proj => { 
      selectEditar.innerHTML += `<option value="${proj}">${proj}</option>`; 
    });
  }

  if (valorActualCrear !== "NUEVO" && valorActualCrear !== "") {
    selectCrear.value = valorActualCrear;
  }
  selectFiltro.value = valorActualFiltro;
  
  actualizarFases('crear');
  actualizarFiltroFases();
}

function actualizarFases(modo) {
  let selectProjId = 'projectSelect';
  let selectFaseId = 'phaseSelect';
  let inputNuevoProjId = 'newProjectInput';
  
  if (modo === 'editar') {
    selectProjId = 'editTaskProject';
    selectFaseId = 'editTaskPhase';
    inputNuevoProjId = null;
  }
  
  const selectProj = document.getElementById(selectProjId);
  const selectFase = document.getElementById(selectFaseId);
  const inputNuevoProj = document.getElementById(inputNuevoProjId);
  
  let proyecto = selectProj.value;
  
  if (proyecto === 'NUEVO' && inputNuevoProj) {
    proyecto = inputNuevoProj.value.trim();
  }
  if (proyecto === '') {
    proyecto = 'General';
  }

  const valorAnterior = selectFase.value;
  selectFase.innerHTML = '<option value="">-- Sin Fase --</option>';
  
  if (fasesPorProyecto[proyecto]) {
    fasesPorProyecto[proyecto].forEach(f => {
       selectFase.innerHTML += `<option value="${f}">${f}</option>`;
    });
  }
  selectFase.innerHTML += '<option value="NUEVA">+ Crear Nueva Fase...</option>';
  
  selectFase.value = valorAnterior;
  
  if (selectFase.selectedIndex === -1) {
    selectFase.value = "";
  }
  
  if (modo === 'crear') {
    actualizarBoton();
  }
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
  
  if (selectFilterFase.selectedIndex === -1) {
    selectFilterFase.value = "todas";
  }
  
  aplicarFiltro();
}

function actualizarBoton() {
  const select = document.getElementById('projectSelect');
  const inputNuevo = document.getElementById('newProjectInput');
  const selectFase = document.getElementById('phaseSelect');
  const inputNuevaFase = document.getElementById('newPhaseInput');
  const btn = document.getElementById('btnPrincipal');
  const colorPicker = document.getElementById('projectColorInput');
  const inputTarea = document.getElementById('taskInput').value.trim();
  
  if (select.value === 'NUEVO') {
    inputNuevo.style.display = 'inline-block';
  } else {
    inputNuevo.style.display = 'none';
    inputNuevo.value = '';
  }

  if (selectFase.value === 'NUEVA') {
    inputNuevaFase.style.display = 'inline-block';
  } else {
    inputNuevaFase.style.display = 'none';
    inputNuevaFase.value = '';
  }

  // Lógica para sincronizar el selector de color
  if (select.value !== 'NUEVO' && select.value !== '' && select.value !== 'General') {
    if (proyectosData[select.value] && typeof proyectosData[select.value] === 'string') {
      colorPicker.value = proyectosData[select.value];
    }
  }

  if (select.value === 'NUEVO' && inputTarea === '') {
    btn.innerText = 'Guardar Proyecto';
  } else if (selectFase.value === 'NUEVA' && inputTarea === '') {
    btn.innerText = 'Guardar Fase';
  } else {
    btn.innerText = 'Agregar Tarea';
  }
}

// NUEVA FUNCIÓN: Actualizar el color de un proyecto directamente a la base de datos
function actualizarColorProyecto() {
  const select = document.getElementById('projectSelect');
  const colorPicker = document.getElementById('projectColorInput');
  
  if (select.value !== 'NUEVO' && select.value !== '' && select.value !== 'General') {
    db.ref(`proyectos/${select.value}`).set(colorPicker.value);
  }
}

function agregarAlTablero() {
  const inputTarea = document.getElementById('taskInput');
  const selectProj = document.getElementById('projectSelect');
  const inputNuevoProj = document.getElementById('newProjectInput');
  const colorPicker = document.getElementById('projectColorInput');
  const selectFase = document.getElementById('phaseSelect');
  const inputNuevaFase = document.getElementById('newPhaseInput');
  const prioridad = document.getElementById('prioritySelect').value;
  
  const textoTarea = inputTarea.value.trim();
  
  let proyecto = selectProj.value;
  
  if (proyecto === 'NUEVO') {
    proyecto = inputNuevoProj.value.trim();
    if (proyecto !== '') {
      // Guardar con el color seleccionado
      db.ref(`proyectos/${proyecto}`).set(colorPicker.value); 
    }
  }
  if (proyecto === '') {
    proyecto = 'General';
  }

  let fase = selectFase.value;
  
  if (fase === 'NUEVA') {
    fase = inputNuevaFase.value.trim();
    if (fase !== '') {
      db.ref(`fases/${proyecto}/${fase}`).set(true);
    }
  }
  
  if (fase === 'NUEVA') {
    fase = '';
  }

  if (textoTarea === '') {
    if (selectProj.value === 'NUEVO' && proyecto !== 'General' && proyecto !== '') {
      alert(`¡Proyecto "${proyecto}" agregado con su color!`);
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
    if (t.columna === 'backlog' && t.orden && t.orden < 1000000) {
      maxOrden = Math.max(maxOrden, parseInt(t.orden));
    }
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
  document.querySelectorAll('.cards-container').forEach(c => {
    c.innerHTML = '';
  });
  
  const filtroPrioridad = document.getElementById('filterPriority').value;
  const filtroProyecto = document.getElementById('filterProject').value;
  const filtroFase = document.getElementById('filterPhase').value;

  const arrayTareas = Object.keys(tareasActuales).map(id => ({
    id, 
    ...tareasActuales[id]
  })).sort((a, b) => {
    return (a.orden || 999999) - (b.orden || 999999);
  });

  arrayTareas.forEach(tarea => {
    const pasaPrioridad = filtroPrioridad === 'todas' || tarea.prioridad === filtroPrioridad;
    const pasaProyecto = filtroProyecto === 'todos' || tarea.proyecto === filtroProyecto;
    const pasaFase = filtroFase === 'todas' || tarea.fase === filtroFase;

    if (pasaPrioridad && pasaProyecto && pasaFase) {
      renderizarTarjeta(tarea.id, tarea);
    }
  });
  
  setTimeout(updateTopScrollWidth, 100); 
}

function aplicarFiltro() {
  const filtroProyecto = document.getElementById('filterProject').value;
  const btnEliminarProyecto = document.getElementById('btnEliminarProyecto');
  
  if (filtroProyecto !== 'todos' && filtroProyecto !== 'General') {
    btnEliminarProyecto.style.display = 'inline-block';
  } else {
    btnEliminarProyecto.style.display = 'none';
  }
  
  renderizarTablero(); 
}

function eliminarProyectoSeleccionado() {
  const proyecto = document.getElementById('filterProject').value;
  
  if (proyecto === 'todos' || proyecto === 'General') {
    return;
  }
  
  if (confirm(`¿Estás seguro de eliminar el proyecto "${proyecto}"?\nSus fases también se borrarán, pero las tareas quedarán huérfanas en "General".`)) {
    db.ref(`proyectos/${proyecto}`).remove();
    db.ref(`fases/${proyecto}`).remove();
    document.getElementById('filterProject').value = 'todos'; 
    actualizarFiltroFases();
  }
}

function generarColorProyecto(nombre) {
  if (!nombre || nombre === 'General') {
    return '#6c757d'; 
  }

  // 1. Verificamos si existe en la base de datos y es un color (no true)
  if (proyectosData[nombre] && typeof proyectosData[nombre] === 'string') {
    return proyectosData[nombre];
  }
  
  // 2. Si no hay color asignado, usamos el cálculo automático
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return `hsl(${Math.abs(hash) % 360}, 75%, 40%)`; 
}

function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  
  if (!columna) {
    return;
  }
  
  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;
  
  card.ondragstart = (e) => { 
    e.dataTransfer.setData('text/plain', id); 
  };

  const badge = document.createElement('div');
  badge.className = 'project-badge';
  
  let textoBadge = tarea.proyecto || 'General';
  
  if (tarea.fase && tarea.fase.trim() !== '') {
    textoBadge += ` | ${tarea.fase}`;
  }
  
  badge.innerText = textoBadge;
  badge.style.backgroundColor = generarColorProyecto(tarea.proyecto);

  const ordenTexto = document.createElement('div');
  ordenTexto.className = 'order-badge';
  
  if (tarea.orden && tarea.orden < 1000000) {
    ordenTexto.innerText = `Posición: ${tarea.orden}`;
  } else {
    ordenTexto.innerText = `Posición: -`;
  }

  const content = document.createElement('div');
  content.className = 'card-content';

  const mainInfo = document.createElement('div');
  mainInfo.className = 'card-main-info';

  const titulo = document.createElement('div');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  const responsable = document.createElement('div');
  responsable.className = 'responsable-badge';
  
  if (tarea.responsable) {
    responsable.innerHTML = `👤 ${tarea.responsable}`;
  } else {
    responsable.innerHTML = `👤 Sin asignar`;
  }

  mainInfo.appendChild(titulo);
  mainInfo.appendChild(responsable);

  const acciones = document.createElement('div');
  acciones.className = 'card-actions';

  const btnEditar = document.createElement('button');
  btnEditar.innerText = '✏️';
  btnEditar.onclick = () => {
    abrirModalEdicion(id);
  };

  const btnEliminar = document.createElement('button');
  btnEliminar.innerText = '🗑️';
  btnEliminar.onclick = () => {
    eliminarTarea(id);
  };

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
  
  if (select.value === 'NUEVA') {
    input.style.display = 'block';
  } else {
    input.style.display = 'none';
  }
  
  if (select.value !== 'NUEVA') {
    input.value = '';
  }
}

function abrirModalEdicion(id) {
  const tarea = tareasActuales[id];
  
  if (!tarea) {
    return;
  }

  document.getElementById('editTaskId').value = id;
  document.getElementById('editTaskTitle').value = tarea.titulo;
  
  const selectProyectoModal = document.getElementById('editTaskProject');
  
  if (selectProyectoModal.querySelector(`option[value="${tarea.proyecto}"]`)) {
    selectProyectoModal.value = tarea.proyecto || 'General';
  }
  
  actualizarFases('editar'); 
  
  const selectFaseModal = document.getElementById('editTaskPhase');
  
  if (selectFaseModal.querySelector(`option[value="${tarea.fase}"]`)) {
    selectFaseModal.value = tarea.fase || '';
  }
  
  verificarNuevaFaseEdicion();

  document.getElementById('editTaskPriority').value = tarea.prioridad;
  document.getElementById('editTaskResponsable').value = tarea.responsable || '';
  
  if (tarea.orden && tarea.orden < 1000000) {
    document.getElementById('editTaskOrder').value = tarea.orden;
  } else {
    document.getElementById('editTaskOrder').value = '';
  }

  document.getElementById('editModal').style.display = 'block';
}

function cerrarModal() { 
  document.getElementById('editModal').style.display = 'none'; 
}

function guardarEdicion() {
  const id = document.getElementById('editTaskId').value;
  const nuevoTitulo = document.getElementById('editTaskTitle').value.trim();
  const nuevoProyecto = document.getElementById('editTaskProject').value;
  const nuevaPrioridad = document.getElementById('editTaskPriority').value;
  const nuevoResponsable = document.getElementById('editTaskResponsable').value.trim();
  const nuevoOrden = parseInt(document.getElementById('editTaskOrder').value);
  
  let nuevaFase = document.getElementById('editTaskPhase').value;
  
  if (nuevaFase === 'NUEVA') {
    nuevaFase = document.getElementById('newEditPhaseInput').value.trim();
    if (nuevaFase !== '') {
      db.ref(`fases/${nuevoProyecto}/${nuevaFase}`).set(true);
    }
  }
  
  if (nuevaFase === 'NUEVA') {
    nuevaFase = '';
  }

  if (nuevoTitulo === '') { 
    alert("El título no puede estar vacío"); 
    return; 
  }

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

function allowDrop(ev) { 
  ev.preventDefault(); 
}

function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.closest('.column').id;
  
  db.ref(`tareas/${idTarea}/columna`).set(columnaDestino);
}

function eliminarTarea(id) {
  if (confirm('¿Eliminar esta tarea del tablero?')) {
    db.ref(`tareas/${id}`).remove();
  }
}
