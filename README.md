# Arena de Bichos

Shooter por equipos en 3D pixelado para 2 a 8 jugadores. Esta carpeta trae el juego y un servidor pequeño para jugar en línea **sin cuenta de nada**: cualquiera con el enlace crea o se une a una sala con un código de 4 letras.

| Archivo | Para qué sirve |
| --- | --- |
| `arena-bichos.html` | El juego. Es el mismo que está publicado en claude.ai. |
| `server.js` | Entrega el juego y conecta a los jugadores de cada sala. |
| `package.json` | Le dice al hosting cómo arrancar el servidor. |

## Probarlo en tu PC

Necesitas [Node.js](https://nodejs.org) 18 o más nuevo.

```bash
npm install
npm start
```

Abre http://localhost:3000. Tus amigos conectados al **mismo wifi** pueden entrar con la IP de tu PC, por ejemplo `http://192.168.1.20:3000` (la ves con `ipconfig`).

## Ponerlo en internet gratis (Render)

1. Crea una cuenta en [github.com](https://github.com) y un repositorio nuevo, por ejemplo `arena-bichos`.
2. En el repositorio, usa **Add file → Upload files** y sube `arena-bichos.html`, `server.js`, `package.json` y `.gitignore`. No subas la carpeta `node_modules`.
3. Crea una cuenta en [render.com](https://render.com) entrando con GitHub.
4. Toca **New → Web Service** y elige tu repositorio.
5. Configura:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
6. Toca **Deploy**. En unos minutos tendrás un enlace como `https://arena-bichos.onrender.com`. Ese es el enlace para tus amigos.

En el plan gratis, el servidor se duerme tras 15 minutos sin jugadores. La primera persona que entre después espera cerca de un minuto a que despierte.

## Actualizar el juego

Cuando cambie `arena-bichos.html`, súbelo de nuevo al repositorio (reemplazando el anterior) y Render vuelve a publicar solo.
