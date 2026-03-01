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
            if (p.licenciaInicio && p.licenciaFin && dateString >= p.licenciaInicio && dateString <= p.licenciaFin) return false;
            if (p.diasNoDisponibles.includes(diaSemana)) return false;
            return true;
        });

        if (candidatos.length > 0) {
            if (esDiaEspecial) {
                candidatos.sort((a, b) => a.guardiasFinde - b.guardiasFinde);
            } else {
                candidatos.sort((a, b) => a.guardiasHabiles - b.guardiasHabiles);
            }

            const elegido = candidatos[0];
            guardiasGeneradas.push({ fecha: dateString, asignado: elegido.nombre, tipo: esDiaEspecial ? 'Finde' : 'Habil' });

            if (esDiaEspecial) elegido.guardiasFinde++;
            else elegido.guardiasHabiles++;
        } else {
            guardiasGeneradas.push({ fecha: dateString, asignado: null, tipo: esDiaEspecial ? 'Finde' : 'Habil' });
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return { guardiasGeneradas, personalActualizado: personalDisponible };
}

// Datos de prueba
const personalPrueba = [
    { id: 1, grado: 'Sgt', nombre: 'Juan Perez', exentoGuardia: false, licenciaInicio: '', licenciaFin: '', diasNoDisponibles: [], guardiasHabiles: 0, guardiasFinde: 0 },
    { id: 2, grado: 'Cbo', nombre: 'Maria Gomez', exentoGuardia: false, licenciaInicio: '', licenciaFin: '', diasNoDisponibles: [3], guardiasHabiles: 0, guardiasFinde: 0 }, // No puede miércoles
    { id: 3, grado: 'Sold', nombre: 'Carlos Ruiz', exentoGuardia: false, licenciaInicio: '2023-10-02', licenciaFin: '2023-10-04', diasNoDisponibles: [], guardiasHabiles: 0, guardiasFinde: 0 }, // Licencia
    { id: 4, grado: 'Subof', nombre: 'Ana Dias', exentoGuardia: true, licenciaInicio: '', licenciaFin: '', diasNoDisponibles: [], guardiasHabiles: 0, guardiasFinde: 0 } // Exenta
];

const feriadosPrueba = ['2023-10-06'];

const resultados = generarGuardiasLogic('2023-10-01', '2023-10-07', personalPrueba, feriadosPrueba);
const { guardiasGeneradas, personalActualizado } = resultados;

console.log("Guardias Generadas:");
guardiasGeneradas.forEach(g => console.log(`${g.fecha} (${g.tipo}) -> ${g.asignado}`));

// Validaciones
assert.strictEqual(guardiasGeneradas.length, 7, "Debería generar 7 guardias");

// 2023-10-01 (Domingo - Finde) - Carlos no en licencia, Maria disponible, Juan disponible
// Ana exenta. Todos guardiasFinde=0
// Se asigna al primero de los 3 (Juan Perez)

// 2023-10-02 (Lunes - Habil) - Carlos en licencia. Se asigna a Maria o Juan.

// Comprobar que nadie exento fue asignado
const anaAsignada = guardiasGeneradas.some(g => g.asignado === 'Ana Dias');
assert.strictEqual(anaAsignada, false, "Ana está exenta, no debería tener guardias");

// Comprobar que Maria no fue asignada un miércoles (2023-10-04)
const guardiaMiercoles = guardiasGeneradas.find(g => g.fecha === '2023-10-04');
assert.notStrictEqual(guardiaMiercoles.asignado, 'Maria Gomez', "Maria no puede hacer guardia los miércoles");

// Comprobar la equidad (Todos deberían tener contadores actualizados)
const juan = personalActualizado.find(p => p.nombre === 'Juan Perez');
const maria = personalActualizado.find(p => p.nombre === 'Maria Gomez');

assert.ok(juan.guardiasHabiles > 0 || juan.guardiasFinde > 0, "Juan debería tener guardias");
assert.ok(maria.guardiasHabiles > 0 || maria.guardiasFinde > 0, "Maria debería tener guardias");

console.log("Todas las pruebas pasaron correctamente.");
