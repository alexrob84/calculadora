const firebaseConfig = {
  apiKey: "AIzaSyCdd4y_IiKG8qQ2xFeFcBVBcB8BZVEeaPA",
  authDomain: "calculadora-r-chop.firebaseapp.com",
  databaseURL: "https://calculadora-r-chop-default-rtdb.firebaseio.com",
  projectId: "calculadora-r-chop",
  storageBucket: "calculadora-r-chop.appspot.com",
  messagingSenderId: "541940623916",
  appId: "1:541940623916:web:5807c5338977378846ff89"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let pacienteEnEdicion = null;

function calcularDosis() {
  const peso = parseFloat(document.getElementById('peso').value);
  const estatura = parseFloat(document.getElementById('estatura').value);
  if (!peso || !estatura) return alert("Introduce peso y estatura válidos.");

  const bsa = 0.007184 * Math.pow(peso, 0.425) * Math.pow(estatura, 0.725);
  const bsaFixed = bsa.toFixed(2);
  const dosis = {
    rituximab: (375 * bsa).toFixed(1),
    ciclofosfamida: (750 * bsa).toFixed(1),
    doxorubicina: (50 * bsa).toFixed(1),
    vincristina: (Math.min(1.4 * bsa, 2)).toFixed(1),
    prednisona: 50
  };

  document.getElementById('resultado').innerHTML = `
    <p><strong>BSA:</strong> ${bsaFixed} m²</p>
    <ul>
      <li>Rituximab: ${dosis.rituximab} mg</li>
      <li>Ciclofosfamida: ${dosis.ciclofosfamida} mg</li>
      <li>Doxorubicina: ${dosis.doxorubicina} mg</li>
      <li>Vincristina: ${dosis.vincristina} mg</li>
      <li>Prednisona: ${dosis.prednisona} mg/día por 5 días</li>
    </ul>`;
}

function guardarPaciente() {
  const nombre = document.getElementById('nombre').value.trim();
  const edad = document.getElementById('edad').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const diagnostico = document.getElementById('diagnostico').value.trim();
  const comentarios = document.getElementById('comentarios').value.trim();
  const peso = parseFloat(document.getElementById('peso').value);
  const estatura = parseFloat(document.getElementById('estatura').value);

  if (!nombre || !edad || !diagnostico || !peso || !estatura) {
    alert("Completa todos los campos requeridos.");
    return;
  }

  // 📆 Formato de fecha con dos dígitos en el año
  const fecha = new Date();
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const añoCorto = fecha.getFullYear().toString().slice(-2);
  const fechaFormateada = `${dia}/${mes}/${añoCorto}`;

  const bsa = 0.007184 * Math.pow(peso, 0.425) * Math.pow(estatura, 0.725);
  const bsaFixed = bsa.toFixed(2);
  const dosis = {
    rituximab: (375 * bsa).toFixed(1),
    ciclofosfamida: (750 * bsa).toFixed(1),
    doxorubicina: (50 * bsa).toFixed(1),
    vincristina: (Math.min(1.4 * bsa, 2)).toFixed(1),
    prednisona: 50
  };

  const id = pacienteEnEdicion || Date.now();
  const paciente = {
    id,
    nombre,
    edad,
    telefono,
    diagnostico,
    comentarios,
    peso,
    estatura,
    bsa: bsaFixed,
    timestamp: fechaFormateada,
    dosis
  };

  db.ref("pacientes/" + id).set(paciente).then(() => {
    pacienteEnEdicion = null;
    document.getElementById('mensaje-edicion').style.display = "none";
    document.getElementById('btnGuardar').textContent = "Guardar en historial";
    limpiarFormulario();
    mostrarHistorial(document.getElementById("busqueda").value);
  });
}

function editarPaciente(id) {
  db.ref("pacientes/" + id).once("value").then(snapshot => {
    const p = snapshot.val();
    if (!p) return;

    document.getElementById('nombre').value = p.nombre;
    document.getElementById('edad').value = p.edad;
    document.getElementById('telefono').value = p.telefono;
    document.getElementById('diagnostico').value = p.diagnostico;
    document.getElementById('comentarios').value = p.comentarios;
    document.getElementById('peso').value = p.peso;
    document.getElementById('estatura').value = p.estatura;

    pacienteEnEdicion = id;
    document.getElementById('mensaje-edicion').style.display = "block";
    document.getElementById('nombre-edicion').textContent = p.nombre;
    document.getElementById('btnGuardar').textContent = "Actualizar datos del paciente";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function mostrarHistorial(filtro = "") {
  db.ref("pacientes").once("value").then(snapshot => {
    let html = `<table><tr><th>Fecha</th><th>Nombre</th><th>Acciones</th></tr>`;
    snapshot.forEach(child => {
      const p = child.val();
      if (!p.nombre || (filtro && !p.nombre.toLowerCase().includes(filtro.toLowerCase()))) return;

      html += `<tr data-id="${p.id}">
        <td>${p.timestamp || ""}</td>
        <td>${p.nombre || ""}</td>
        <td>
          <div class="acciones">
            <button title="Ver detalles" onclick="mostrarDetalles(${p.id})">👁️</button>
            <button title="Editar paciente" onclick="editarPaciente(${p.id})">✏️</button>
            <button title="Eliminar paciente" onclick="eliminarPaciente(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    });
    html += "</table>";
    document.getElementById("historial").innerHTML = html;
  });
}

function mostrarDetalles(id) {
  db.ref("pacientes/" + id).once("value").then(snapshot => {
    const p = snapshot.val();
    if (!p) return;

    const html = `
      <h3>Datos del paciente</h3>
      <p><strong>Nombre:</strong> ${p.nombre}</p>
      <p><strong>Edad:</strong> ${p.edad}</p>
      <p><strong>Teléfono:</strong> ${p.telefono}</p>
      <p><strong>Diagnóstico:</strong> ${p.diagnostico}</p>
      <p><strong>Comentarios:</strong> ${p.comentarios}</p>
      <p><strong>Peso:</strong> ${p.peso} kg</p>
      <p><strong>Estatura:</strong> ${p.estatura} cm</p>
      <p><strong>BSA:</strong> ${p.bsa} m²</p>
      <hr>
      <p><strong>Rituximab:</strong> ${p.dosis?.rituximab} mg</p>
      <p><strong>Ciclofosfamida:</strong> ${p.dosis?.ciclofosfamida} mg</p>
      <p><strong>Doxorubicina:</strong> ${p.dosis?.doxorubicina} mg</p>
      <p><strong>Vincristina:</strong> ${p.dosis?.vincristina} mg</p>
      <p><strong>Prednisona:</strong> ${p.dosis?.prednisona} mg/día por 5 días</p>
    `;

    document.getElementById("modalContenido").innerHTML = html;
    document.getElementById("modal").style.display = "block";
  });
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

function eliminarPaciente(id) {
  const confirmar = confirm("¿Estás seguro de que deseas eliminar este paciente?");
  if (!confirmar) return;

  db.ref("pacientes/" + id).remove().then(() => {
    mostrarHistorial(document.getElementById("busqueda").value);
  });
}

function filtrarHistorial() {
  const filtro = document.getElementById("busqueda").value;
  mostrarHistorial(filtro);
}

function limpiarFormulario() {
  document.getElementById('nombre').value = "";
  document.getElementById('edad').value = "";
  document.getElementById('telefono').value = "";
  document.getElementById('diagnostico').value = "";
  document.getElementById('comentarios').value = "";
  document.getElementById('peso').value = "";
  document.getElementById('estatura').value = "";
  document.getElementById('resultado').innerHTML = "";
}

window.onload = () => mostrarHistorial();

