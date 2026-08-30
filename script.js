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

// Inicializar Firebase (Versión Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refTareas = db.ref('tareas');

let tareasActuales = {}; // Aquí guardamos las tareas para filtrarlas rápido

// Escuchar cambios en TIEMPO REAL desde la base de datos
refTareas.on('value', (snapshot) => {
  tareasActuales = snapshot.val() || {};
  renderizarTablero();
});

// Limpiar y dibujar el tablero según el filtro seleccionado
function renderizarTablero() {
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  const filtro = document.getElementById('filterPriority').value;

  Object.keys(tareasActuales).forEach(id => {
    const tarea = tareasActuales[id];
    // Solo dibujamos si el filtro es 'todas' o coincide con la prioridad
    if (filtro === 'todas' || tarea.prioridad === filtro) {
      renderizarTarjeta(id, tarea);
    }
  });
}

// Se ejecuta al cambiar el select del filtro
function aplicarFiltro() {
  renderizarTablero();
}

// Dibujar una tarjeta individual
function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  if (!columna) return;

  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;

  card.ondragstart = (e) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Contenedor para el texto del título
  const titulo = document.createElement('span');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  // Contenedor para los botones de acción
  const acciones = document.createElement('div');
  acciones.className = 'card-actions';

  // Botón Editar
  const btnEditar = document.createElement('button');
  btnEditar.innerText = '✏️';
  btnEditar.title = 'Editar tarea';
  btnEditar.onclick = () => editarTarea(id, tarea.titulo);

  // Botón Eliminar
  const btnEliminar = document.createElement('button');
  btnEliminar.innerText = '🗑️';
  btnEliminar.title = 'Eliminar tarea';
  btnEliminar.onclick = () => eliminarTarea(id);

  acciones.appendChild(btnEditar);
  acciones.appendChild(btnEliminar);

  card.appendChild(titulo);
  card.appendChild(acciones);
  
  container.appendChild(card);
}

// Eliminar tarea de Firebase
function eliminarTarea(id) {
  if (confirm('¿Estás seguro de eliminar esta tarea?')) {
    db.ref(`tareas/${id}`).remove();
  }
}

// Editar tarea en Firebase
function editarTarea(id, tituloActual) {
  const nuevoTitulo = prompt('Edita el nombre de la tarea:', tituloActual);
  if (nuevoTitulo && nuevoTitulo.trim() !== '') {
    db.ref(`tareas/${id}`).update({ titulo: nuevoTitulo.trim() });
  }
}

// Permitir soltar tarjetas
function allowDrop(ev) {
  ev.preventDefault();
}

// Lógica para soltar la tarjeta y actualizar su estado
function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.id;

  // Actualiza en Firebase la nueva columna de la tarea
  db.ref(`tareas/${idTarea}/columna`).set(columnaDestino);
}

// Agregar nueva tarea
function agregarTarea() {
  const input = document.getElementById('taskInput');
  const prioridad = document.getElementById('prioritySelect').value;
  const texto = input.value.trim();

  if (texto === '') return;

  const nuevaTareaRef = refTareas.push();
  nuevaTareaRef.set({
    titulo: texto,
    prioridad: prioridad,
    columna: 'backlog'
  });

  input.value = '';
}
