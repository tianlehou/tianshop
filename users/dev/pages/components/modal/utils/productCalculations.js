// productCalculations.js
export function formatInputAsDecimal(input) {
    input.addEventListener("input", () => {
      const rawValue = input.value.replace(/\D/g, "");
      const numericValue = parseFloat(rawValue) / 100;
      input.value = numericValue.toFixed(2);
    });
  }
  
  export function calcularCostoConItbmsYGanancia({
    ventaInput,
    costoInput,
    unidadesInput,
    itbmsInput,
    descuentoInput,
    costoConItbmsDescuentoInput,
    costoUnitarioInput,
    gananciaInput,
    porcentajeInput,
    costoConItbmsDescuentoLabel,
  }) {
    const ventaVal = parseFloat(ventaInput.value) || 0;
    const costoVal = parseFloat(costoInput.value) || 0;
    const unidadesVal = parseFloat(unidadesInput.value) || 1;
    const itbmsPorcentaje = parseFloat(itbmsInput.value) || 0;
    const descuentoVal = parseFloat(descuentoInput.value) || 0;
  
    const costoConItbms = costoVal + (costoVal * itbmsPorcentaje) / 100 - descuentoVal;
  
    costoConItbmsDescuentoInput.value = costoConItbms.toFixed(2);
  
    if (itbmsPorcentaje > 0 || descuentoVal > 0) {
      costoConItbmsDescuentoInput.style.display = "block";
      costoConItbmsDescuentoLabel.style.display = "block";
  
      if (itbmsPorcentaje > 0 && descuentoVal > 0) {
        costoConItbmsDescuentoLabel.textContent = "Costo con Itbms & Descuento";
      } else if (itbmsPorcentaje > 0) {
        costoConItbmsDescuentoLabel.textContent = "Costo con Itbms";
      } else {
        costoConItbmsDescuentoLabel.textContent = "Costo con Descuento";
      }
    } else {
      costoConItbmsDescuentoInput.style.display = "none";
      costoConItbmsDescuentoLabel.style.display = "none";
    }
  
    const costoUnitarioVal = parseFloat(costoConItbms / unidadesVal).toFixed(4);
    costoUnitarioInput.value = costoUnitarioVal;
  
    const gananciaVal = (ventaVal - costoUnitarioVal).toFixed(2);
    gananciaInput.value = gananciaVal;
  
    const porcentajeGanancia =
      costoUnitarioVal > 0 ? (((ventaVal - costoUnitarioVal) / costoUnitarioVal) * 100).toFixed(2) : 0;
    porcentajeInput.value = `${porcentajeGanancia}`;
  }
  