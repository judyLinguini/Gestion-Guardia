// Simular entorno básico para probar la lógica principal sin DOM
const assert = require('assert');

// Extraer la lógica pura de la función generarGuardias para probar
function generarGuardiasLogic(fechaInicio, fechaFin, personal, feriados) {
    let fechaActual = new Date(fechaInicio + 'T00:00:00');
    const fechaFinal = new Date(fechaFin + 'T00:00:00');

    let guardiasGeneradas = [];
    let personalDisponible = JSON.parse(JSON.stringify(personal));

    while (fechaActual <= fechaFinal) {
        const dateString = fechaActual.toISOString().split('T')[0];
        const diaSemana = fechaActual.getDay();

        const esFinde = (diaSemana === 0 || diaSemana === 6);
        const esFeriado = feriados.includes(dateString);
        const esDiaEspecial = esFinde || esFeriado;

        let candidatos = personalDisponible.filter(p => {
            if (p.exentoGuardia) return false;

            // Verificación simplificada de licencia
            if (p.licenciaInicio && p.licenciaFin && dateString >= p.licenciaInicio && dateString <= p.licenciaFin) return false;
            if (p.licencias && p.licencias.length > 0) {
                let enLicencia = p.licencias.some(lic => dateString >= lic.inicio && dateString <= lic.fin);
                if (enLicencia) return false;
            }

            // Verificación simplificada de dias no disponibles
            if (p.diasNoDisponibles && p.diasNoDisponibles.includes(diaSemana)) return false;
            if (p.fechasNoDisponibles && p.fechasNoDisponibles.includes(dateString)) return false;

            // Evitar dos días consecutivos de guardia
            if (p.ultimaGuardia) {
                let fechaUltima = new Date(p.ultimaGuardia + 'T00:00:00');
                let diffTime = Math.abs(fechaActual - fechaUltima);
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 1) {
                    return false;
                }
            }

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
                nombresElegidos.push(elegido.nombre);
                idsElegidos.push(elegido.id);

                elegido.totalGuardias = (elegido.totalGuardias || 0) + 1;
                elegido.ultimaGuardia = dateString;
            }
        }

        if (elegidos.length > 0) {
            guardiasGeneradas.push({
                fecha: dateString,
                asignado: nombresElegidos.join(' y '),
                idAsignado: idsElegidos,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil'
            });
        } else {
            guardiasGeneradas.push({
                fecha: dateString,
                asignado: "NADIE DISPONIBLE",
                idAsignado: null,
                tipo: esDiaEspecial ? 'Finde/Feriado' : 'Hábil'
            });
        }

        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return { guardiasGeneradas, personalActualizado: personalDisponible };
}

// Datos de prueba
const personalPrueba = [
    { id: 1, grado: 'Sgto. 1ª', nombre: 'Juan Perez', exentoGuardia: false, licencias: [], diasNoDisponibles: [], totalGuardias: 0, ultimaGuardia: null },
    { id: 2, grado: 'Cabo 1ª', nombre: 'Maria Gomez', exentoGuardia: false, licencias: [], diasNoDisponibles: [3], totalGuardias: 0, ultimaGuardia: null }, // No puede miércoles
    { id: 3, grado: 'Sdo.', nombre: 'Carlos Ruiz', exentoGuardia: false, licencias: [{inicio: '2023-10-02', fin: '2023-10-04'}], diasNoDisponibles: [], totalGuardias: 0, ultimaGuardia: null }, // Licencia
    { id: 4, grado: 'Sgto. 2ª', nombre: 'Ana Dias', exentoGuardia: true, licencias: [], diasNoDisponibles: [], totalGuardias: 0, ultimaGuardia: null }, // Exenta
    { id: 5, grado: 'Sdo.', nombre: 'Pedro Lopez', exentoGuardia: false, licencias: [], diasNoDisponibles: [], totalGuardias: 0, ultimaGuardia: null },
    { id: 6, grado: 'Sdo.', nombre: 'Diego Martinez', exentoGuardia: false, licencias: [], diasNoDisponibles: [], totalGuardias: 0, ultimaGuardia: null }
];

const feriadosPrueba = ['2023-10-06'];

const resultados = generarGuardiasLogic('2023-10-01', '2023-10-07', personalPrueba, feriadosPrueba);
const { guardiasGeneradas, personalActualizado } = resultados;

console.log("Guardias Generadas:");
guardiasGeneradas.forEach(g => console.log(`${g.fecha} (${g.tipo}) -> ${g.asignado}`));

// Validaciones
assert.strictEqual(guardiasGeneradas.length, 7, "Debería generar 7 guardias");

// Comprobar que nadie exento fue asignado
const anaAsignada = guardiasGeneradas.some(g => g.asignado.includes('Ana Dias'));
assert.strictEqual(anaAsignada, false, "Ana está exenta, no debería tener guardias");

// Comprobar que Maria no fue asignada un miércoles (2023-10-04)
const guardiaMiercoles = guardiasGeneradas.find(g => g.fecha === '2023-10-04');
assert.ok(!guardiaMiercoles.asignado.includes('Maria Gomez'), "Maria no puede hacer guardia los miércoles");

// Comprobar la equidad
const juan = personalActualizado.find(p => p.nombre === 'Juan Perez');
const maria = personalActualizado.find(p => p.nombre === 'Maria Gomez');

assert.ok(juan.totalGuardias > 0, "Juan debería tener guardias");
assert.ok(maria.totalGuardias > 0, "Maria debería tener guardias");

// Validar que se asignaron 2 personas donde fue posible
const guardiaDomingo = guardiasGeneradas.find(g => g.fecha === '2023-10-01');
assert.ok(guardiaDomingo.asignado.includes(' y '), "Deberían haber 2 personas asignadas en domingo (separadas por ' y ')");

console.log("Todas las pruebas pasaron correctamente.");
