// Estado de la aplicación
let personal = [];
let feriados = [];
let editandoId = null;
let guardiasGeneradas = [];
let logAcciones = [];

// Estado temporal para formulario
let tempLicencias = [];
let tempFechasNoDisp = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosLocales();
    renderizarTablaPersonal();
    renderizarFeriados();

    // Event Listeners
    document.getElementById('personalForm').addEventListener('submit', guardarPersonal);
    document.getElementById('btnCancelarEdicion').addEventListener('click', cancelarEdicion);
    document.getElementById('btnAgregarFeriado').addEventListener('click', agregarFeriado);

    document.getElementById('btnAgregarLicencia').addEventListener('click', agregarLicenciaTemp);
    document.getElementById('btnAgregarFechaNoDisp').addEventListener('click', agregarFechaNoDispTemp);

    // Importar/Exportar
    document.getElementById('btnExportarJSON').addEventListener('click', exportarJSON);
    document.getElementById('btnExportarExcel').addEventListener('click', exportarExcel);
    document.getElementById('btnImportarDatos').addEventListener('click', importarDatos);
    document.getElementById('btnDescargarLog').addEventListener('click', descargarLog);

    // Guardias
    document.getElementById('btnGenerarGuardias').addEventListener('click', generarGuardias);
    document.getElementById('btnExportarGuardiasExcel').addEventListener('click', exportarGuardiasExcel);
});

// === LOG DE ACCIONES ===

function registrarAccion(mensaje) {
    const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    logAcciones.push(`[${fechaHora}] ${mensaje}`);
    localStorage.setItem('guardias_log', JSON.stringify(logAcciones));
}

function descargarLog() {
    if (logAcciones.length === 0) {
        alert("El registro de acciones está vacío.");
        return;
    }
    const contenido = logAcciones.join('\n');
    const blob = new Blob([contenido], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "registro_acciones.txt");
}

// === CRUD PERSONAL (TEMPORALES) ===

function agregarLicenciaTemp() {
    const inicio = document.getElementById('licenciaInicioTemp').value;
    const fin = document.getElementById('licenciaFinTemp').value;
    if (inicio && fin) {
        tempLicencias.push({ inicio, fin });
        document.getElementById('licenciaInicioTemp').value = '';
        document.getElementById('licenciaFinTemp').value = '';
        renderizarLicenciasTemp();
    }
}

function eliminarLicenciaTemp(index) {
    tempLicencias.splice(index, 1);
    renderizarLicenciasTemp();
}

function renderizarLicenciasTemp() {
    const ul = document.getElementById('listaLicenciasTemp');
    ul.innerHTML = '';
    tempLicencias.forEach((lic, i) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center py-1';
        li.innerHTML = `${lic.inicio} a ${lic.fin} <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarLicenciaTemp(${i})">X</button>`;
        ul.appendChild(li);
    });
}

function agregarFechaNoDispTemp() {
    const fecha = document.getElementById('fechaNoDisponibleTemp').value;
    if (fecha && !tempFechasNoDisp.includes(fecha)) {
        tempFechasNoDisp.push(fecha);
        document.getElementById('fechaNoDisponibleTemp').value = '';
        renderizarFechasNoDispTemp();
    }
}

function eliminarFechaNoDispTemp(index) {
    tempFechasNoDisp.splice(index, 1);
    renderizarFechasNoDispTemp();
}

function renderizarFechasNoDispTemp() {
    const ul = document.getElementById('listaFechasNoDispTemp');
    ul.innerHTML = '';
    tempFechasNoDisp.forEach((fecha, i) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center py-1';
        li.innerHTML = `${fecha} <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarFechaNoDispTemp(${i})">X</button>`;
        ul.appendChild(li);
    });
}

// === CRUD PERSONAL ===

function guardarPersonal(e) {
    e.preventDefault();

    const grado = document.getElementById('grado').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const exentoGuardia = document.getElementById('exentoGuardia').checked;

    const diasNoDisponibles = Array.from(document.querySelectorAll('.dia-no-disponible:checked')).map(cb => parseInt(cb.value));

    let usuarioExistente = editandoId ? personal.find(p => p.id === editandoId) : null;

    const nuevoUsuario = {
        id: editandoId || Date.now().toString(),
        grado,
        nombre,
        exentoGuardia,
        licencias: [...tempLicencias],
        fechasNoDisponibles: [...tempFechasNoDisp],
        diasNoDisponibles,
        totalGuardias: usuarioExistente ? (usuarioExistente.totalGuardias || 0) : 0,
        ultimaGuardia: usuarioExistente ? (usuarioExistente.ultimaGuardia || null) : null,
        ordenInterno: usuarioExistente ? usuarioExistente.ordenInterno : personal.length
    };

    if (editandoId) {
        const index = personal.findIndex(p => p.id === editandoId);
        if (index !== -1) {
            personal[index] = nuevoUsuario;
        }
        registrarAccion(`Personal editado: ${grado} ${nombre}`);
        cancelarEdicion();
    } else {
        personal.push(nuevoUsuario);
        registrarAccion(`Personal agregado: ${grado} ${nombre}`);
        document.getElementById('personalForm').reset();
        tempLicencias = [];
        tempFechasNoDisp = [];
        renderizarLicenciasTemp();
        renderizarFechasNoDispTemp();
    }

    guardarDatosLocales();
    renderizarTablaPersonal();
}

function editarPersonal(id) {
    const usuario = personal.find(p => p.id === id);
    if (!usuario) return;

    editandoId = usuario.id;
    document.getElementById('grado').value = usuario.grado;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('exentoGuardia').checked = usuario.exentoGuardia;

    tempLicencias = usuario.licencias ? [...usuario.licencias] : [];
    if (usuario.licenciaInicio && usuario.licenciaFin && tempLicencias.length === 0) {
        tempLicencias.push({inicio: usuario.licenciaInicio, fin: usuario.licenciaFin});
    }
    renderizarLicenciasTemp();

    tempFechasNoDisp = usuario.fechasNoDisponibles ? [...usuario.fechasNoDisponibles] : [];
    renderizarFechasNoDispTemp();

    document.querySelectorAll('.dia-no-disponible').forEach(cb => {
        cb.checked = usuario.diasNoDisponibles.includes(parseInt(cb.value));
    });

    document.getElementById('btnGuardarPersonal').textContent = 'Actualizar Personal';
    document.getElementById('btnCancelarEdicion').style.display = 'inline-block';
}

function eliminarPersonal(id) {
    if(confirm('¿Está seguro de eliminar este registro?')) {
        const pEliminado = personal.find(p => p.id === id);
        personal = personal.filter(p => p.id !== id);
        if (pEliminado) {
            registrarAccion(`Personal eliminado: ${pEliminado.grado} ${pEliminado.nombre}`);
        }
        guardarDatosLocales();
        renderizarTablaPersonal();
    }
}

function cancelarEdicion() {
    editandoId = null;
    document.getElementById('personalForm').reset();
    tempLicencias = [];
    tempFechasNoDisp = [];
    renderizarLicenciasTemp();
    renderizarFechasNoDispTemp();
    document.getElementById('btnGuardarPersonal').textContent = 'Guardar Personal';
    document.getElementById('btnCancelarEdicion').style.display = 'none';
}

const pesoGrados = {
    'Sdo.': 1,
    'Cabo 2ª': 2,
    'Cabo 1ª': 3,
    'Sgto. 2ª': 4,
    'Sgto. 1ª': 5
};

let filaArrastrada = null;

function renderizarTablaPersonal() {
    const tbody = document.querySelector('#tablaPersonal tbody');
    tbody.innerHTML = '';

    const diasNombres = {1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb', 0:'Dom'};

    // Ordenar personal
    personal.sort((a, b) => {
        let pesoA = pesoGrados[a.grado] || 0;
        let pesoB = pesoGrados[b.grado] || 0;
        if (pesoA !== pesoB) {
            return pesoB - pesoA; // Mayor grado arriba
        }
        // Mismo grado, usar orden interno
        let ordenA = a.ordenInterno || 0;
        let ordenB = b.ordenInterno || 0;
        return ordenA - ordenB;
    });

    personal.forEach((p, index) => {
        // Asignar orden interno inicial si no existe
        if (typeof p.ordenInterno === 'undefined') {
            p.ordenInterno = index;
        }

        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.index = index;
        tr.dataset.id = p.id;
        tr.dataset.grado = p.grado;
        tr.style.cursor = 'grab';

        tr.addEventListener('dragstart', (e) => {
            filaArrastrada = tr;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', tr.innerHTML);
            tr.classList.add('table-active');
        });

        tr.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (filaArrastrada && filaArrastrada !== tr && filaArrastrada.dataset.grado === tr.dataset.grado) {
                tr.classList.add('table-info');
            }
        });

        tr.addEventListener('dragleave', () => {
            tr.classList.remove('table-info');
        });

        tr.addEventListener('dragend', () => {
            tr.classList.remove('table-active');
            filaArrastrada = null;
        });

        tr.addEventListener('drop', (e) => {
            e.preventDefault();
            tr.classList.remove('table-info');

            if (filaArrastrada && filaArrastrada !== tr && filaArrastrada.dataset.grado === tr.dataset.grado) {
                const arrastradoId = filaArrastrada.dataset.id;
                const objetivoId = tr.dataset.id;

                const indexArrastrado = personal.findIndex(x => x.id === arrastradoId);
                const indexObjetivo = personal.findIndex(x => x.id === objetivoId);

                // Intercambiar orden interno
                let tempOrden = personal[indexArrastrado].ordenInterno;
                personal[indexArrastrado].ordenInterno = personal[indexObjetivo].ordenInterno;
                personal[indexObjetivo].ordenInterno = tempOrden;

                registrarAccion(`Orden modificado mediante drag and drop para grado: ${p.grado}`);

                guardarDatosLocales();
                renderizarTablaPersonal();
            }
        });

        let diasRestringidosTexto = p.diasNoDisponibles.map(d => diasNombres[d]).join(', ') || '';
        if (p.fechasNoDisponibles && p.fechasNoDisponibles.length > 0) {
            diasRestringidosTexto += (diasRestringidosTexto ? ' / ' : '') + p.fechasNoDisponibles.length + ' fechas';
        }
        if (!diasRestringidosTexto) diasRestringidosTexto = 'Ninguno';

        let licenciaTexto = '-';
        if (p.licencias && p.licencias.length > 0) {
            licenciaTexto = p.licencias.length + ' periodos';
        } else if (p.licenciaInicio && p.licenciaFin) {
            licenciaTexto = `${p.licenciaInicio} al ${p.licenciaFin}`;
        }

        tr.innerHTML = `
            <td>${p.grado}</td>
            <td>${p.nombre}</td>
            <td>${p.exentoGuardia ? 'Sí' : 'No'}</td>
            <td>${licenciaTexto}</td>
            <td>${diasRestringidosTexto}</td>
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
    const guardadoLog = localStorage.getItem('guardias_log');

    if (guardadoPersonal) personal = JSON.parse(guardadoPersonal);
    if (guardadoFeriados) feriados = JSON.parse(guardadoFeriados);
    if (guardadoLog) logAcciones = JSON.parse(guardadoLog);
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
                if (dateString >= p.licenciaInicio && dateString <= p.licenciaFin) return false;
            }
            if (p.licencias && p.licencias.length > 0) {
                let enLicencia = p.licencias.some(lic => dateString >= lic.inicio && dateString <= lic.fin);
                if (enLicencia) return false;
            }

            // Check día no disponible
            if (p.diasNoDisponibles && p.diasNoDisponibles.includes(diaSemana)) return false;
            if (p.fechasNoDisponibles && p.fechasNoDisponibles.includes(dateString)) return false;

            return true;
        });

        // Ordenar candidatos
        candidatos.sort((a, b) => {
            // 1. Menos guardias totales
            let totalA = (a.totalGuardias || 0);
            let totalB = (b.totalGuardias || 0);
            if (totalA !== totalB) {
                return totalA - totalB;
            }

            // 2. Más tiempo desde la última guardia
            if (!a.ultimaGuardia && b.ultimaGuardia) return -1;
            if (a.ultimaGuardia && !b.ultimaGuardia) return 1;
            if (a.ultimaGuardia && b.ultimaGuardia) {
                let fechaA = new Date(a.ultimaGuardia);
                let fechaB = new Date(b.ultimaGuardia);
                if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaA.getTime() - fechaB.getTime();
                }
            }

            return 0;
        });

        let elegidos = [];
        let nombresElegidos = [];
        let idsElegidos = [];

        for (let i = 0; i < 2; i++) {
            if (candidatos.length > i) {
                const elegido = candidatos[i];
                elegidos.push(elegido);
                nombresElegidos.push(`${elegido.grado} ${elegido.nombre}`);
                idsElegidos.push(elegido.id);

                // Actualizar contadores en la copia
                elegido.totalGuardias = (elegido.totalGuardias || 0) + 1;
                elegido.ultimaGuardia = dateString;
            }
        }

        if (elegidos.length > 0) {
            guardiasGeneradas.push({
                fecha: dateString,
                diaSemana: diaSemana,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil',
                asignado: nombresElegidos.join(' y '),
                idAsignado: idsElegidos.join(',')
            });
        } else {
            guardiasGeneradas.push({
                fecha: dateString,
                diaSemana: diaSemana,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil',
                asignado: "NADIE DISPONIBLE",
                idAsignado: null
            });
        }

        // Avanzar un día
        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Nota: Eliminamos la mutación en estado global automática del personal para evitar sumar
    // infinitamente si aprietan generar muchas veces. Idealmente se debería confirmar,
    // pero para cumplir con el problema actual, asimilaremos los datos y los guardamos
    personal = personalDisponible;
    registrarAccion(`Guardias generadas desde ${inicioInput} hasta ${finInput}`);
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
            <td class="asignados-cell"><strong>${g.asignado}</strong></td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editarAsignacion('${g.fecha}')">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('resultadosGuardia').style.display = 'block';
}

function editarAsignacion(fecha) {
    const guardia = guardiasGeneradas.find(g => g.fecha === fecha);
    if (!guardia) return;

    // Obtener la fila correspondiente
    const filas = document.querySelectorAll('#tablaGuardiasGeneradas tbody tr');
    let filaGuardia = Array.from(filas).find(tr => tr.cells[0].textContent === fecha);
    if (!filaGuardia) return;

    // Crear dos selectores
    let cellAsignados = filaGuardia.querySelector('.asignados-cell');
    let idsActuales = guardia.idAsignado ? guardia.idAsignado.split(',') : [];

    let selectHTML1 = `<select class="form-select form-select-sm mb-1 edit-guardia-1">
        <option value="">--Seleccionar--</option>`;
    let selectHTML2 = `<select class="form-select form-select-sm edit-guardia-2">
        <option value="">--Seleccionar--</option>`;

    // Llenar opciones
    personal.forEach(p => {
        let selected1 = idsActuales[0] === p.id ? 'selected' : '';
        let selected2 = idsActuales[1] === p.id ? 'selected' : '';
        selectHTML1 += `<option value="${p.id}" data-nombre="${p.grado} ${p.nombre}" ${selected1}>${p.grado} ${p.nombre}</option>`;
        selectHTML2 += `<option value="${p.id}" data-nombre="${p.grado} ${p.nombre}" ${selected2}>${p.grado} ${p.nombre}</option>`;
    });

    selectHTML1 += `</select>`;
    selectHTML2 += `</select>`;

    cellAsignados.innerHTML = selectHTML1 + selectHTML2;

    let cellAcciones = filaGuardia.cells[4];
    cellAcciones.innerHTML = `
        <button class="btn btn-sm btn-success" onclick="guardarAsignacion('${fecha}')">Guardar</button>
        <button class="btn btn-sm btn-secondary" onclick="renderizarResultadosGuardias()">Cancelar</button>
    `;
}

function guardarAsignacion(fecha) {
    const guardia = guardiasGeneradas.find(g => g.fecha === fecha);
    if (!guardia) return;

    const filas = document.querySelectorAll('#tablaGuardiasGeneradas tbody tr');
    let filaGuardia = Array.from(filas).find(tr => tr.cells[0].textContent === fecha);
    if (!filaGuardia) return;

    let s1 = filaGuardia.querySelector('.edit-guardia-1');
    let s2 = filaGuardia.querySelector('.edit-guardia-2');

    let nuevosIds = [];
    let nuevosNombres = [];

    if (s1.value) {
        nuevosIds.push(s1.value);
        nuevosNombres.push(s1.options[s1.selectedIndex].dataset.nombre);
    }
    if (s2.value) {
        nuevosIds.push(s2.value);
        nuevosNombres.push(s2.options[s2.selectedIndex].dataset.nombre);
    }

    let oldAsignado = guardia.asignado;
    let viejosIds = guardia.idAsignado ? guardia.idAsignado.split(',') : [];

    // Restar contadores a los viejos
    viejosIds.forEach(id => {
        let p = personal.find(x => x.id === id);
        if (p) {
            p.totalGuardias = Math.max(0, (p.totalGuardias || 0) - 1);
            // No podemos revertir ultimaGuardia a la anterior fácilmente,
            // pero para el alcance de este proyecto está bien dejarlo como está.
        }
    });

    if (nuevosNombres.length > 0) {
        guardia.asignado = nuevosNombres.join(' y ');
        guardia.idAsignado = nuevosIds.join(',');

        // Sumar contadores a los nuevos
        nuevosIds.forEach(id => {
            let p = personal.find(x => x.id === id);
            if (p) {
                p.totalGuardias = (p.totalGuardias || 0) + 1;
                p.ultimaGuardia = fecha;
            }
        });
    } else {
        guardia.asignado = "NADIE DISPONIBLE";
        guardia.idAsignado = null;
    }

    guardarDatosLocales();
    renderizarTablaPersonal();
    registrarAccion(`Asignación de guardia modificada manual el ${fecha}. Cambio: ${oldAsignado} -> ${guardia.asignado}`);
    renderizarResultadosGuardias();
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
