// autoDeleteExpiredShares.js
import { ref, get, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../toast/toastLoader.js";

// Función para limpiar y convertir fechas en formato regional a un timestamp válido
function parseIntlFormattedDate(dateString) {
  if (!dateString || typeof dateString !== "string") {
    console.error("Fecha inválida o nula:", dateString);
    return NaN;
  }

  try {
    // Normalizar caracteres invisibles (espacios no separadores, etc.)
    const cleanedDate = dateString.replace(/\s+/g, " ").trim();

    // Normalizar el formato de la fecha
    const normalizedDate = cleanedDate
      .replace("p. m.", "PM")
      .replace("a. m.", "AM")
      .replace("ene", "Jan")
      .replace("feb", "Feb")
      .replace("mar", "Mar")
      .replace("abr", "Apr")
      .replace("may", "May")
      .replace("jun", "Jun")
      .replace("jul", "Jul")
      .replace("ago", "Aug")
      .replace("sep", "Sep")
      .replace("oct", "Oct")
      .replace("nov", "Nov")
      .replace("dic", "Dec");

    // Extraer los componentes de la fecha y hora
    const datePattern = /(\d{1,2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)/;
    const match = normalizedDate.match(datePattern);

    if (!match) {
      console.error("El formato de la fecha no coincide con el esperado:", normalizedDate);
      return NaN;
    }

    const [, day, month, year, hours, minutes, period] = match;

    // Convertir la hora a formato 24 horas
    let hour = parseInt(hours, 10);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    // Crear la fecha usando el constructor Date
    const parsedDate = new Date(`${month} ${day}, ${year} ${hour}:${minutes}:00 GMT-5`);
    return parsedDate.getTime();
  } catch (error) {
    console.error("Error al parsear la fecha:", error);
    return NaN;
  }
}

// Función principal para eliminar datos expirados
export async function autoDeleteExpiredShares(currentUserEmail) {
  try {
    if (!currentUserEmail) {
      console.error("El correo del usuario actual no está disponible.");
      return;
    }

    // Convertir el correo a clave válida para Firebase
    const currentUserKey = currentUserEmail.replaceAll(".", "_");

    // Referencia a los datos compartidos
    const sharedDataRef = ref(database, `users/${currentUserKey}/shared/data`);
    const sharedDataSnapshot = await get(sharedDataRef);

    if (!sharedDataSnapshot.exists()) {
      console.log("No se encontraron datos compartidos para el usuario:", currentUserEmail);
      return;
    }

    const now = Date.now();
    const sharedData = sharedDataSnapshot.val();

    for (const sharedByKey in sharedData) {
      const userSharedData = sharedData[sharedByKey];
      console.log(`Revisando datos compartidos por ${sharedByKey}`);

      const metadata = userSharedData.metadata;

      // Verificar que metadata y expiresAt existan
      if (!metadata || !metadata.expiresAt) {
        console.warn(
          `Metadatos incompletos o faltantes para datos compartidos por ${sharedByKey}. Omitiendo...`
        );
        continue;
      }

      // Parsear la fecha utilizando la función
      const expirationTimestamp = parseIntlFormattedDate(metadata.expiresAt);

      // Validar si el timestamp es válido
      if (isNaN(expirationTimestamp)) {
        console.warn(
          `Fecha de expiración inválida o mal formateada para datos compartidos por ${sharedByKey}. Valor: ${metadata.expiresAt}`
        );
        continue;
      }

      // Verificar si la fecha actual supera la fecha de expiración
      if (now > expirationTimestamp) {
        // Eliminar la carpeta completa de datos compartidos
        const sharedByRef = ref(database, `users/${currentUserKey}/shared/data/${sharedByKey}`);
        await remove(sharedByRef);

        console.log(
          `Datos compartidos por ${sharedByKey} eliminados por expiración. Fecha de expiración: ${metadata.expiresAt}`
        );
      }
    }

    console.log("Revisión de datos compartidos completada para el usuario:", currentUserEmail);
  } catch (error) {
    console.error("Error en la eliminación automática de datos compartidos:", error);
    showToast("Hubo un error al procesar la limpieza de datos compartidos.", "error");
  }
}