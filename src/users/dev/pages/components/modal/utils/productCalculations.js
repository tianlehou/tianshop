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

  // Aplica el descuento primero
  const costoConDescuento = costoVal - descuentoVal;

  // Luego aplica el impuesto (itbms)
  const itbmsAplicado = (costoConDescuento * itbmsPorcentaje) / 100;
  const costoConItbms = costoConDescuento + itbmsAplicado;

  // Actualiza el valor en el campo correspondiente
  costoConItbmsDescuentoInput.value = costoConItbms.toFixed(2);

  if (itbmsPorcentaje > 0 || descuentoVal > 0) {
      costoConItbmsDescuentoInput.style.display = "block";
      costoConItbmsDescuentoLabel.style.display = "block";

      if (itbmsPorcentaje > 0 && descuentoVal > 0) {
          costoConItbmsDescuentoLabel.textContent = "Costo con Descuento E Itbms aplicado";
      } else if (itbmsPorcentaje > 0) {
          costoConItbmsDescuentoLabel.textContent = "Costo con Itbms aplicado";
      } else {
          costoConItbmsDescuentoLabel.textContent = "Costo con Descuento aplicado";
      }
  } else {
      costoConItbmsDescuentoInput.style.display = "none";
      costoConItbmsDescuentoLabel.style.display = "none";
  }

  // Calcula el costo unitario
  const costoUnitarioVal = parseFloat(costoConItbms / unidadesVal).toFixed(4);
  costoUnitarioInput.value = costoUnitarioVal;

  // Calcula la ganancia
  const gananciaVal = (ventaVal - costoUnitarioVal).toFixed(2);
  gananciaInput.value = gananciaVal;

  // Calcula el porcentaje de ganancia
  const porcentajeGanancia =
      costoUnitarioVal > 0
          ? (((ventaVal - costoUnitarioVal) / costoUnitarioVal) * 100).toFixed(2)
          : 0;
  porcentajeInput.value = `${porcentajeGanancia}`;
}
