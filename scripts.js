document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("postalForm");
    const resultado = document.getElementById("resultado");
  
    // API Keys
    const SHOTSTACK_API_KEY = "fomzbd1lafH6sd2cNNQQap8yrS9l54BAWghLPqbu";
    const PEXELS_API_KEY = "km1HgknvLectFgn6dBkm1KeWUB4V2HHpLJ9GEreapsghU1IW87bQxJK3";
    const PEXELS_URL = "https://api.pexels.com/v1/search?query=christmas&per_page=15";
  
    // Imagen de fondo aleatoria desde Pexels (para el body visual)
    async function cargarFondoAleatorio() {
      try {
        const res = await fetch(PEXELS_URL, {
          headers: {
            Authorization: PEXELS_API_KEY
          }
        });
  
        const data = await res.json();
        const fotos = data.photos;
  
        if (fotos.length > 0) {
          const indexAleatorio = Math.floor(Math.random() * fotos.length);
          const imagenUrl = fotos[indexAleatorio].src.large2x;
  
          document.body.style.backgroundImage = `url(${imagenUrl})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
        }
      } catch (error) {
        console.error("Error al cargar imagen de fondo:", error);
      }
    }
  
    cargarFondoAleatorio();
  
    // Envío del formulario
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const nombre = document.getElementById("nombre").value.trim();
      const mensaje = document.getElementById("mensaje").value.trim();
      resultado.innerHTML = `Procesando postal para <strong>${nombre}</strong>...`;
  
      // Obtener imagen aleatoria desde Pexels para usarla en el vídeo
      let imagenFondo = "";
      try {
        const res = await fetch(PEXELS_URL, {
          headers: {
            Authorization: PEXELS_API_KEY
          }
        });
  
        const data = await res.json();
        const fotos = data.photos;
  
        if (fotos.length > 0) {
          const indexAleatorio = Math.floor(Math.random() * fotos.length);
          imagenFondo = fotos[indexAleatorio].src.landscape; // formato horizontal para vídeo
        }
      } catch (error) {
        console.error("Error al obtener imagen para el vídeo:", error);
      }
  
      // Payload del vídeo con imagen de fondo y texto
      const payload = {
        timeline: {
          tracks: [
            // Fondo con imagen aleatoria de Pexels
            {
                clips: [
                    {
                        asset: {
                            type: "html",
                            html: `
                              <html>
                                <head>
                                  <style>
                                    html, body {
                                      margin: 0;
                                      padding: 0;
                                      background: #b30000;
                                      width: 100%;
                                      height: 100%;
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                    }
                                    .mensaje {
                                      font-size: 36px;
                                      font-family: 'Poppins', sans-serif;
                                      font-weight: bold;
                                      color: white;
                                      padding: 30px;
                                      border-radius: 15px;
                                      text-align: center;
                                      line-height: 1.5;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="mensaje">
                                    ¡Feliz Navidad, ${nombre}! 🎄<br>${mensaje}
                                  </div>
                                </body>
                              </html>
                            `
                          },
                          
                          
                        start: 0,
                        length: 6,
                        position: "center",
                        transition: {
                          in: "fade",
                          out: "fade"
                        }
                      }
                      
                      
                ]
              }
          ]
        },
        output: {
          format: "mp4",
          resolution: "sd"
        }
      };
      
      
      
      
  
      try {
        const response = await fetch("https://api.shotstack.io/stage/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": SHOTSTACK_API_KEY
          },
          body: JSON.stringify(payload)
        });
  
        const data = await response.json();
        console.log("✅ Respuesta completa de Shotstack:", JSON.stringify(data, null, 2));
  
        if (!data.success) {
          console.error("❌ Shotstack error:", JSON.stringify(data, null, 2));
          resultado.innerHTML = "Error al generar la postal. Mira la consola para más detalles.";
          return;
        }
  
        const renderId = data.response.id;
        resultado.innerHTML = "Postal enviada para renderizado. Esperando resultado...";
  
        checkRenderStatus(renderId, SHOTSTACK_API_KEY);
      } catch (error) {
        console.error("❌ Error al generar postal:", error);
        resultado.innerHTML = "Hubo un error al crear la postal. Intenta de nuevo.";
      }
    });
  
    async function checkRenderStatus(id, apiKey) {
      const statusUrl = `https://api.shotstack.io/stage/render/${id}`;
  
      const intervalo = setInterval(async () => {
        try {
          const res = await fetch(statusUrl, {
            headers: {
              "x-api-key": apiKey
            }
          });
  
          const data = await res.json();
  
          if (!data.response) {
            console.error("❌ Respuesta inválida al chequear estado:", JSON.stringify(data, null, 2));
            clearInterval(intervalo);
            resultado.innerHTML = "Error al obtener el estado del vídeo.";
            return;
          }
  
          const status = data.response.status;
  
          if (status === "done") {
            clearInterval(intervalo);
            const url = data.response.url;
  
            resultado.innerHTML = `
              <div class="card-postal">
                <h2>🎉 Tu postal está lista</h2>
                <video src="${url}" controls></video>
                <p>¡Disfrútala y compártela!</p>
              </div>
            `;
          } else if (status === "failed") {
            clearInterval(intervalo);
            console.error("❌ Render fallido:", JSON.stringify(data, null, 2));
            resultado.innerHTML = "La postal falló al renderizar 😓. Mira la consola para más detalles.";
          }
        } catch (err) {
          console.error("❌ Error al chequear estado:", err);
          clearInterval(intervalo);
          resultado.innerHTML = "Error al obtener el estado del render.";
        }
      }, 3000);
    }
  });
  