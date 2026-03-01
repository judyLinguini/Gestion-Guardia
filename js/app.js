// Estado de la aplicación
let personal = [];
let feriados = [];
let editandoId = null;
let guardiasGeneradas = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosLocales();
    renderizarTablaPersonal();
    renderizarFeriados();

    // Event Listeners
    document.getElementById('personalForm').addEventListener('submit', guardarPersonal);
    document.getElementById('btnCancelarEdicion').addEventListener('click', cancelarEdicion);
    document.getElementById('btnAgregarFeriado').addEventListener('click', agregarFeriado);

    // Importar/Exportar
    document.getElementById('btnExportarJSON').addEventListener('click', exportarJSON);
    document.getElementById('btnExportarExcel').addEventListener('click', exportarExcel);
    document.getElementById('btnImportarDatos').addEventListener('click', importarDatos);

    // Guardias
    document.getElementById('btnGenerarGuardias').addEventListener('click', generarGuardias);
    document.getElementById('btnExportarGuardiasExcel').addEventListener('click', exportarGuardiasExcel);
});

// === CRUD PERSONAL ===

function guardarPersonal(e) {
    e.preventDefault();

    const grado = document.getElementById('grado').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const exentoGuardia = document.getElementById('exentoGuardia').checked;
    const licenciaInicio = document.getElementById('licenciaInicio').value;
    const licenciaFin = document.getElementById('licenciaFin').value;

    const diasNoDisponibles = Array.from(document.querySelectorAll('.dia-no-disponible:checked')).map(cb => parseInt(cb.value));

    const guardiasHabiles = parseInt(document.getElementById('guardiasHabiles').value) || 0;
    const guardiasFinde = parseInt(document.getElementById('guardiasFinde').value) || 0;

    const nuevoUsuario = {
        id: editandoId || Date.now().toString(),
        grado,
        nombre,
        exentoGuardia,
        licenciaInicio,
        licenciaFin,
        diasNoDisponibles,
        guardiasHabiles,
        guardiasFinde
    };

    if (editandoId) {
        const index = personal.findIndex(p => p.id === editandoId);
        if (index !== -1) {
            personal[index] = nuevoUsuario;
        }
        cancelarEdicion();
    } else {
        personal.push(nuevoUsuario);
    }

    guardarDatosLocales();
    renderizarTablaPersonal();
    document.getElementById('personalForm').reset();
}

function editarPersonal(id) {
    const usuario = personal.find(p => p.id === id);
    if (!usuario) return;

    editandoId = usuario.id;
    document.getElementById('grado').value = usuario.grado;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('exentoGuardia').checked = usuario.exentoGuardia;
    document.getElementById('licenciaInicio').value = usuario.licenciaInicio;
    document.getElementById('licenciaFin').value = usuario.licenciaFin;
    document.getElementById('guardiasHabiles').value = usuario.guardiasHabiles;
    document.getElementById('guardiasFinde').value = usuario.guardiasFinde;

    document.querySelectorAll('.dia-no-disponible').forEach(cb => {
        cb.checked = usuario.diasNoDisponibles.includes(parseInt(cb.value));
    });

    document.getElementById('btnGuardarPersonal').textContent = 'Actualizar Personal';
    document.getElementById('btnCancelarEdicion').style.display = 'inline-block';
}

function eliminarPersonal(id) {
    if(confirm('¿Está seguro de eliminar este registro?')) {
        personal = personal.filter(p => p.id !== id);
        guardarDatosLocales();
        renderizarTablaPersonal();
    }
}

function cancelarEdicion() {
    editandoId = null;
    document.getElementById('personalForm').reset();
    document.getElementById('btnGuardarPersonal').textContent = 'Guardar Personal';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
}

function renderizarTablaPersonal() {
    const tbody = document.querySelector('#tablaPersonal tbody');
    tbody.innerHTML = '';

    const diasNombres = {1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb', 0:'Dom'};

    personal.forEach(p => {
        const tr = document.createElement('tr');

        const diasRestringidosTexto = p.diasNoDisponibles.map(d => diasNombres[d]).join(', ') || 'Ninguno';
        const licenciaTexto = (p.licenciaInicio && p.licenciaFin) ? `${p.licenciaInicio} al ${p.licenciaFin}` : '-';

        tr.innerHTML = `
            <td>${p.grado}</td>
            <td>${p.nombre}</td>
            <td>${p.exentoGuardia ? 'Sí' : 'No'}</td>
            <td>${licenciaTexto}</td>
            <td>${diasRestringidosTexto}</td>
            <td>${p.guardiasHabiles}</td>
            <td>${p.guardiasFinde}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editarPersonal('${p.id}')">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarPersonal('${p.id}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// === FERIADOS ===

function agregarFeriado() {
    const fecha = document.getElementById('nuevoFeriado').value;
    if (fecha && !feriados.includes(fecha)) {
        feriados.push(fecha);
        guardarDatosLocales();
        renderizarFeriados();
    }
    document.getElementById('nuevoFeriado').value = '';
}

function eliminarFeriado(fecha) {
    feriados = feriados.filter(f => f !== fecha);
    guardarDatosLocales();
    renderizarFeriados();
}

function renderizarFeriados() {
    const ul = document.getElementById('listaFeriados');
    ul.innerHTML = '';

    feriados.sort().forEach(fecha => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            ${fecha}
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarFeriado('${fecha}')">Eliminar</button>
        `;
        ul.appendChild(li);
    });
}

// === PERSISTENCIA LOCAL ===

function guardarDatosLocales() {
    localStorage.setItem('guardias_personal', JSON.stringify(personal));
    localStorage.setItem('guardias_feriados', JSON.stringify(feriados));
}

function cargarDatosLocales() {
    const guardadoPersonal = localStorage.getItem('guardias_personal');
    const guardadoFeriados = localStorage.getItem('guardias_feriados');

    if (guardadoPersonal) personal = JSON.parse(guardadoPersonal);
    if (guardadoFeriados) feriados = JSON.parse(guardadoFeriados);
}

// === GENERACIÓN DE GUARDIAS ===

function generarGuardias() {
    const inicioInput = document.getElementById('fechaInicioGuardias').value;
    const finInput = document.getElementById('fechaFinGuardias').value;

    if (!inicioInput || !finInput) {
        alert("Por favor, seleccione un rango de fechas válido.");
        return;
    }

    let fechaActual = new Date(inicioInput + 'T00:00:00');
    const fechaFinal = new Date(finInput + 'T00:00:00');

    if (fechaActual > fechaFinal) {
        alert("La fecha de inicio no puede ser posterior a la fecha final.");
        return;
    }

    guardiasGeneradas = [];

    // Hacemos una copia profunda del personal para simular la asignación
    // sin alterar los datos originales hasta que se confirme,
    // pero en este caso guardaremos directamente para el ejercicio.
    let personalDisponible = JSON.parse(JSON.stringify(personal));

    while (fechaActual <= fechaFinal) {
        const dateString = fechaActual.toISOString().split('T')[0];
        const diaSemana = fechaActual.getDay(); // 0: Dom, 1: Lun...

        // Determinar tipo de día
        const esFinde = (diaSemana === 0 || diaSemana === 6);
        const esFeriado = feriados.includes(dateString);
        const esDiaEspecial = esFinde || esFeriado;

        // Filtrar personal disponible para ESTE día
        let candidatos = personalDisponible.filter(p => {
            if (p.exentoGuardia) return false;

            // Check licencia
            if (p.licenciaInicio && p.licenciaFin) {
                if (dateString >= p.licenciaInicio && dateString <= p.licenciaFin) {
                    return false;
                }
            }

            // Check día no disponible
            if (p.diasNoDisponibles.includes(diaSemana)) {
                return false;
            }

            return true;
        });

        if (candidatos.length === 0) {
            guardiasGeneradas.push({
                fecha: dateString,
                diaSemana: diaSemana,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil',
                asignado: "NADIE DISPONIBLE",
                idAsignado: null
            });
        } else {
            // Ordenar por cantidad de guardias para ser justos
            if (esDiaEspecial) {
                candidatos.sort((a, b) => a.guardiasFinde - b.guardiasFinde);
            } else {
                candidatos.sort((a, b) => a.guardiasHabiles - b.guardiasHabiles);
            }

            const elegido = candidatos[0];

            guardiasGeneradas.push({
                fecha: dateString,
                diaSemana: diaSemana,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil',
                asignado: `${elegido.grado} ${elegido.nombre}`,
                idAsignado: elegido.id
            });

            // Actualizar contadores en la copia
            if (esDiaEspecial) {
                elegido.guardiasFinde++;
            } else {
                elegido.guardiasHabiles++;
            }
        }

        // Avanzar un día
        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Actualizar el estado global del personal con los nuevos contadores
    personal = personalDisponible;
    guardarDatosLocales();
    renderizarTablaPersonal();
    renderizarResultadosGuardias();
}

function renderizarResultadosGuardias() {
    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const tbody = document.querySelector('#tablaGuardiasGeneradas tbody');
    tbody.innerHTML = '';

    guardiasGeneradas.forEach(g => {
        const tr = document.createElement('tr');

        if (g.tipo === 'Hábil') tr.classList.add('guardia-habil');
        else tr.classList.add('guardia-finde');

        tr.innerHTML = `
            <td>${g.fecha}</td>
            <td>${diasNombres[g.diaSemana]}</td>
            <td>${g.tipo}</td>
            <td><strong>${g.asignado}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('resultadosGuardia').style.display = 'block';
}

function exportarGuardiasExcel() {
    if (guardiasGeneradas.length === 0) return;

    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const ws_data = [
        ["Fecha", "Día", "Tipo", "Personal Asignado"]
    ];

    guardiasGeneradas.forEach(g => {
        ws_data.push([
            g.fecha,
            diasNombres[g.diaSemana],
            g.tipo,
            g.asignado
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guardias");
    XLSX.writeFile(wb, "lista_guardias.xlsx");
}

// === IMPORTAR/EXPORTAR ===

function exportarJSON() {
    const data = { personal, feriados };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json;charset=utf-8"});
    saveAs(blob, "respaldo_guardias.json");
}

function exportarExcel() {
    const ws_data = [
        ["ID", "Grado", "Nombre", "Exento", "Licencia Inicio", "Licencia Fin", "Días Restringidos", "Guardias Hábiles", "Guardias Finde"]
    ];

    personal.forEach(p => {
        ws_data.push([
            p.id, p.grado, p.nombre, p.exentoGuardia ? "Si" : "No",
            p.licenciaInicio || "", p.licenciaFin || "",
            p.diasNoDisponibles.join(","),
            p.guardiasHabiles, p.guardiasFinde
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personal");
    XLSX.writeFile(wb, "personal_guardias.xlsx");
}

function importarDatos() {
    const fileInput = document.getElementById('importarArchivo');
    if (!fileInput.files.length) {
        alert("Por favor seleccione un archivo.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const contenido = e.target.result;

        if (file.name.endsWith('.json')) {
            try {
                const data = JSON.parse(contenido);
                if (data.personal) personal = data.personal;
                if (data.feriados) feriados = data.feriados;
                guardarDatosLocales();
                renderizarTablaPersonal();
                renderizarFeriados();
                alert("Datos importados desde JSON correctamente.");
            } catch (error) {
                alert("Error al leer el archivo JSON.");
            }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            try {
                const wb = XLSX.read(contenido, {type: 'binary'});
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                personal = data.map(row => ({
                    id: row["ID"] || Date.now().toString() + Math.random(),
                    grado: row["Grado"] || "",
                    nombre: row["Nombre"] || "",
                    exentoGuardia: row["Exento"] === "Si" || row["Exento"] === true,
                    licenciaInicio: row["Licencia Inicio"] || "",
                    licenciaFin: row["Licencia Fin"] || "",
                    diasNoDisponibles: row["Días Restringidos"] ? String(row["Días Restringidos"]).split(",").map(Number).filter(n => !isNaN(n)) : [],
                    guardiasHabiles: parseInt(row["Guardias Hábiles"]) || 0,
                    guardiasFinde: parseInt(row["Guardias Finde"]) || 0
                }));

                guardarDatosLocales();
                renderizarTablaPersonal();
                alert("Datos importados desde Excel correctamente.");
            } catch (error) {
                alert("Error al leer el archivo Excel.");
            }
        } else {
            alert("Formato de archivo no soportado.");
        }
    };

    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}
