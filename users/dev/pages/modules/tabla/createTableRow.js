// createTableRow.js
export function createTableRow(productData, filaNumero) {
  const sharedInfoPopover = productData.sharedByEmail
    ? `<button class="custom-button info-btn"
              data-bs-toggle="popover"
              data-bs-html="true"
              data-bs-placement="top"
              title="Información Compartida"
              data-bs-content="
                Compartido por: <strong>${productData.sharedByEmail}</strong><br>
                Fecha: <strong>${productData.sharedAt}</strong>
              ">  
              <i class="bi bi-info-circle"></i>
      </button>
    `
    : "";

  return `
      <tr>
        <td class="text-center sticky-col-1">${filaNumero}</td>
        <td class="text-center sticky-col-2">
          <button class="btn custom-button" 
                  type="button"
                  data-bs-toggle="popover" 
                  data-bs-html="true"
                  data-bs-placement="right"
                  data-bs-content="
                    <div class='d-flex flex-row gap-2 p-1'>
                      <button class='btn btn-sm btn-warning edit-product-button' data-id='${productData.id}'>
                        Editar
                      </button>
                      <button class='btn btn-sm btn-danger delete-product-button' data-id='${productData.id}'>
                        Eliminar
                      </button>
                      <button class='btn btn-sm btn-secondary duplicate-product-button' data-id='${productData.id}'>
                        Duplicar
                      </button>
                  ">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          ${sharedInfoPopover}
        </td>
        <td class="text-center">${productData.fecha}</td>
        <td class="text-center">
          ${productData.producto.empresa} 
        </td>
        <td class="text-center">${productData.producto.marca}</td>
        <td class="text-center">${productData.producto.descripcion}</td>
        <td class="text-center">${productData.precio.venta}</td>
        <td class="text-center">${productData.precio.costoUnitario}</td>
        <td class="text-center">${productData.precio.ganancia}</td>
        <td class="text-center">${productData.precio.porcentaje}%</td>
        <td class="text-center">${productData.precio.costo}</td>
        <td class="text-center">${productData.precio.unidades}</td>
      </tr>
  `;
}
