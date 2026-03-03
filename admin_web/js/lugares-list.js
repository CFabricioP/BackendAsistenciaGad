// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     const response = await fetch("/api/lugares");
//     const lugares = await response.json();

//     const tabla = document.getElementById("tablaLugares");
//     tabla.innerHTML = "";

//     lugares.forEach((lugar, index) => {
//       const fila = document.createElement("tr");

//       fila.innerHTML = `
//         <td>${index + 1}</td>
//         <td>${lugar.nombre}</td>
//         <td>${lugar.ubicacion}</td>
//         <td>${lugar.latitud}</td>
//         <td>${lugar.longitud}</td>
//         <td>
//           <button class="btn btn-success btn-sm" onclick="editarLugar(${lugar.id})">
//             <i class="fas fa-sync-alt"></i>
//           </button>
//         </td>
//         <td>
//           <button class="btn btn-danger btn-sm" onclick="eliminarLugar(${lugar.id})">
//             <i class="fas fa-trash-alt"></i>
//           </button>
//         </td>
//       `;

//       tabla.appendChild(fila);
//     });
//   } catch (error) {
//     console.error("Error al cargar los lugares:", error);
//   }
// });

// function editarLugar(id) {
//   // Redirige a una página de edición o implementa una función modal
//   alert("Función de edición aún no implementada. ID: " + id);
// }

// async function eliminarLugar(id) {
//   if (confirm("¿Estás seguro de que deseas eliminar este lugar?")) {
//     try {
//       const response = await fetch(`/api/lugares/${id}`, {
//         method: "DELETE",
//       });

//       if (response.ok) {
//         alert("Lugar eliminado correctamente.");
//         location.reload();
//       } else {
//         alert("Error al eliminar el lugar.");
//       }
//     } catch (error) {
//       console.error("Error al eliminar:", error);
//     }
//   }
// }