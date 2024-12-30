export function createTableRow(productData, filaNumero) {
  // Verificar sharedBy
  console.log("Verificando sharedBy:", productData.sharedBy, "para el producto:", productData.id);

  // Botón de información compartida, se muestra si existe sharedByEmail
  const sharedInfoPopover = productData.sharedByEmail
    ? `<button class="custom-button info-btn"
        data-bs-toggle="popover"
        data-bs-html="true"
        data-bs-placement="top"
        title="<span class='info-shared-popover-header'>Información Compartida</span>"
        data-bs-content="
          <div class='info-shared-popover-body'>
            Compartido por: <strong>${productData.sharedByEmail}</strong><br>
            Fecha: <strong>${productData.sharedAt}</strong>
          </div>
          <button class='btn btn-sm btn-danger delete-shared-button' 
                  data-shared-by='${productData.sharedBy}' 
                  data-id='${productData.id}'>
            Eliminar
          </button>
        ">  
      <i class="bi bi-info-circle"></i>
    </button>`
    : "";

  // Resto del código permanece igual...
  const actionButton = !productData.sharedByEmail
    ? `<button class="btn custom-button" 
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
                    </div>
                  ">
            <i class="bi bi-three-dots-vertical"></i>
          </button>`
    : "";

  return `
      <tr>
        <td class="text-center sticky-col-1">${filaNumero}</td>
        <td class="text-center sticky-col-2">
          ${actionButton}
          ${sharedInfoPopover}
        </td>
        <td class="text-center">${productData.fecha}</td>
        <td class="text-center">${productData.producto.empresa}</td>
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
