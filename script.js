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

// Variable donde guardaremos temporalmente todas las tareas para poder filtrarlas
let tareasActuales = {}; 

// 2. Escuchar cambios en la base de datos (Cuando abres la página o alguien mueve algo)
refTareas.on('value', (snapshot) => {
  tareasActuales = snapshot.val() || {};
  renderizarTablero(); // Llamamos a la función que dibuja las tareas
});

// 3. Función para limpiar las columnas y dibujar solo las tareas que pasen el filtro
function renderizarTablero() {
  // Limpiamos todo el tablero visualmente
  document.querySelectorAll('.cards-container').forEach(c => c.innerHTML = '');
  
  // Miramos qué opción escogió el usuario en el menú desplegable (todas, alta, media, baja)
  const filtro = document.getElementById('filterPriority').value;

  // Recorremos todas las tareas guardadas
  Object.keys(tareasActuales).forEach(id => {
    const tarea = tareasActuales[id];
    
    // Si el filtro dice "todas" o la prioridad de la tarea coincide con el filtro, la dibujamos
    if (filtro === 'todas' || tarea.prioridad === filtro) {
      renderizarTarjeta(id, tarea);
    }
  });
}

// 4. Esta función se dispara cada vez que el usuario cambia el menú desplegable
function aplicarFiltro() {
  renderizarTablero();
}

// 5. Función encargada de crear el "cuadrito" (tarjeta) HTML para cada tarea
function renderizarTarjeta(id, tarea) {
  const columna = document.getElementById(tarea.columna);
  if (!columna) return;

  const container = columna.querySelector('.cards-container');
  
  const card = document.createElement('div');
  card.className = `card ${tarea.prioridad}`;
  card.draggable = true;
  card.id = id;

  // Evento para poder arrastrar la tarjeta
  card.ondragstart = (e) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Creamos el texto de la tarea
  const titulo = document.createElement('span');
  titulo.className = 'card-title';
  titulo.innerText = tarea.titulo;

  // Creamos el contenedor para los botoncitos
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

  // Juntamos todo dentro de la tarjeta
  acciones.appendChild(btnEditar);
  acciones.appendChild(btnEliminar);
  card.appendChild(titulo);
  card.appendChild(acciones);
  
  // Ponemos la tarjeta en su columna correspondiente
  container.appendChild(card);
}

// 6. Lógica para Eliminar la tarea de Firebase
function eliminarTarea(id) {
  if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
    db.ref(`tareas/${id}`).remove(); // Borra el registro en la base de datos
  }
}

// 7. Lógica para Editar el título de la tarea en Firebase
function editarTarea(id, tituloActual) {
  // Abre una ventanita preguntando el nuevo nombre
  const nuevoTitulo = prompt('Edita el nombre de la tarea:', tituloActual);
  
  // Si el usuario escribió algo y le dio Aceptar, actualiza la base de datos
  if (nuevoTitulo && nuevoTitulo.trim() !== '') {
    db.ref(`tareas/${id}`).update({ titulo: nuevoTitulo.trim() });
  }
}

// 8. Funciones obligatorias para que funcione el arrastrar y soltar (Drag and Drop)
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  const idTarea = ev.dataTransfer.getData('text/plain');
  const columnaDestino = ev.currentTarget.id;

  // Actualiza en la base de datos la nueva columna donde soltaste la tarjeta
  db.ref(`tareas/${idTarea}/columna`).set(columnaDestino);
}

// 9. Lógica para el botón azul de "Agregar Tarea"
function agregarTarea() {
  const input = document.getElementById('taskInput');
  const prioridad = document.getElementById('prioritySelect').value;
  const texto = input.value.trim();

  // Si no escribió nada, no hace nada
  if (texto === '') return;

  // Crea un nuevo registro en Firebase bajo la columna 'backlog' (Por Iniciar)
  const nuevaTareaRef = refTareas.push();
  nuevaTareaRef.set({
    titulo: texto,
    prioridad: prioridad,
    columna: 'backlog'
  });

  // Limpia el campo de texto después de agregar
  input.value = '';
}
