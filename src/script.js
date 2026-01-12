/*
******************************
Titulo: Práctica 3 - Juego Retro
Asignatura: Fundamentos de tecnología de Videojuegos - 11º DDV
Autores: David Benítez Vázquez y Daniel Borges Cano
Institución: Universidad Rey Juan Carlos
Fecha: 27/12/2025

*******************************

*********************************************************************
Recursos de audio obtenidos de: https://sounds.spriters-resource.com/arcade/pacman/asset/404131/

*********************************************************************
*/



//const astar = require("./astar");



//direcciones de movimiento
const MovingDirection = {
    up: 0,
    down: 1,
    left: 2,
    right: 3,
};

//tipos de fantasma
const GhostType = {
  BLINKY: 0,
  PINKY: 1,
  INKY: 2,
  CLYDE: 3
};


/////////
//PAC-MAN
/////////
class Pacman {
  constructor(x, y, tileSize, velocity, tileMap) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap;

    this.currentMovingDirection = MovingDirection.right;
    this.requestedMovingDirection = null;

    this.pacmanAnimationTimerDefault = 10;
    this.pacmanAnimationTimer = null;
    this.madeFirstMove = false;

    this.pacmanRotation = this.Rotation.right;
    
    //sonidos
    this.dotSound1 = new Audio("sfx/eat_dot_0.wav"); 
    this.dotSound2 = new Audio("sfx/eat_dot_1.wav");
    this.eatSound = new Audio("sfx/eat_ghost.wav");
    this.audioBuffer = 1;

    document.addEventListener("keydown", this.keydown);

    this.loadPacmanSprites();
  }

  // cuantas rotaciones de 90º hay que hacer para llegar a esa rotación
  Rotation = {
    right: 0,
    down: 1,
    left: 2,
    up: 3,
  };

  draw(ctx, pause) {

    if (!pause) {
      this.move();
      this.animate();
    }

    this.eatDot();
    this.eatPowerDot();

    const size = this.tileSize / 2;

    ctx.save();
    ctx.translate(this.x + size, this.y + size);
    ctx.rotate((this.pacmanRotation * 90 * Math.PI) / 180);
    ctx.drawImage(
      this.pacmanSprites[this.pacmanSpriteIndex],
      -size - 5,
      -size - 5,
      this.tileSize * 1.8,
      this.tileSize * 1.8
    );

    ctx.restore();
  }

  loadPacmanSprites() {
    const pacman1 = new Image();
    pacman1.src = "images/pacman1.png";

    const pacman2 = new Image();
    pacman2.src = "images/pacman2.png";

    const pacman3 = new Image();
    pacman3.src = "images/pacman3.png";

    this.pacmanSprites = [pacman1, pacman2, pacman3, pacman2];

    this.pacmanSpriteIndex = 0;
  }

  
  // keydown es un "arrow function"
  // el if statement que comprueba tu "currentMovingDirection" se usa para no utilizar el sistema de buffer si el jugador
  // quiere cambiar de sentido al momento, es decir: si vienes de arriba (vas para abajo) y quieres volver a ir arriba,
  // no hay que hacer comprobaciones ya que el juego sabe con seguridad que puedes ir hacia arriba, ya que vienes de allí
  keydown = (event) => {

    //se registra un primer movimiento nada mas pulsar una tecla    
    

    // arr
    if (event.keyCode == 38) {
      if (this.currentMovingDirection == MovingDirection.down) {
        this.currentMovingDirection = MovingDirection.up;
      }
      this.requestedMovingDirection = MovingDirection.up;
      this.madeFirstMove = true;
    }
    // aba
    if (event.keyCode == 40) {
      if (this.currentMovingDirection == MovingDirection.up) {
        this.currentMovingDirection = MovingDirection.down;
      }
      this.requestedMovingDirection = MovingDirection.down;
      this.madeFirstMove = true;
    }
    // izq
    if (event.keyCode == 37) {
      if (this.currentMovingDirection == MovingDirection.right) {
        this.currentMovingDirection = MovingDirection.left;
      }
      this.requestedMovingDirection = MovingDirection.left;
      this.madeFirstMove = true;
    }
    // der
    if (event.keyCode == 39) {
      if (this.currentMovingDirection == MovingDirection.left) {
        this.currentMovingDirection = MovingDirection.right;
      }
      this.requestedMovingDirection = MovingDirection.right;
      this.madeFirstMove = true;
    }
  };
  move() {

    if (this.currentMovingDirection !== this.requestedMovingDirection) {
      if (
        Number.isInteger(this.x / this.tileSize) &&
        Number.isInteger(this.y / this.tileSize)
      ) {
        if (
          !this.tileMap.didCollideWithWall(
            this.x,
            this.y,
            this.requestedMovingDirection
          )
        )
          this.currentMovingDirection = this.requestedMovingDirection;
      }
    }

    if (
      this.tileMap.didCollideWithWall(
        this.x,
        this.y,
        this.currentMovingDirection
      )
    ) {
      this.pacmanAnimationTimer = null;
      this.pacmanSpriteIndex = 2;
      return;
    } else if (
      (this.currentMovingDirection != null) &
      (this.pacmanAnimationTimer == null)
    ) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
    }

    switch (this.currentMovingDirection) {
      case MovingDirection.up:
        this.y -= this.velocity;
        this.pacmanRotation = this.Rotation.up;
        break;
      case MovingDirection.down:
        this.y += this.velocity;
        this.pacmanRotation = this.Rotation.down;
        break;
      case MovingDirection.left:
        this.x -= this.velocity;
        this.pacmanRotation = this.Rotation.left;
        break;
      case MovingDirection.right:
        this.x += this.velocity;
        this.pacmanRotation = this.Rotation.right;
        break;
    }

    //intento de warp
    if (this.x <= 0) this.x += 432;
    else if (this.x >= 432) this.x -= 432;
  }

  //Devuelve la posición de forma exacta para cuadrícula.
  //Importante: invierte X, Y porque A* los trabaja así
  getTilePosition() {
    return {
      row: Math.floor(this.y / this.tileSize),
      col: Math.floor(this.x / this.tileSize)}
  }

  animate() {
    if (this.pacmanAnimationTimer == null) {
      return;
    }
    this.pacmanAnimationTimer--;
    if (this.pacmanAnimationTimer == 0) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
      this.pacmanSpriteIndex++;
      if (this.pacmanSpriteIndex == this.pacmanSprites.length)
        this.pacmanSpriteIndex = 0;
    }
  }
  eatDot() {
    if (this.tileMap.eatTilemapDot(this.x, this.y) && this.madeFirstMove) {

      //playsound
      if (this.audioBuffer === 1) {
        this.audioBuffer = 2;
        this.dotSound2.play();
      } else {
        this.audioBuffer = 1;
        this.dotSound1.play();
      }

      dotsEaten++;
      score += 10;
    }
  }
  eatPowerDot() {
    if (this.tileMap.eatTilemapPowerDot(this.x, this.y)) {
      
      //activar modo "pánico"
      mode = "panic";
      modeTimer = 0;

      sirenAudio.pause();
      panicAudio.play();

      dotsEaten++;
      score += 50;
    }
  }
  eatGhost(enemy) {
    //comprueba si está en pánico y no ha sido comido
    
    if (enemy.collideWith(this) && mode === "panic" && !enemy.isEaten) {
      
      enemy.isEaten = true;

      combo += 2;
      score += combo * 100;
      clearTimeout(hideBonusUI);
      showBonusUI(combo * 100);

      // sonido
      this.eatSound.play();
    
  }
  }
}

///////
//ENEMY
///////
class Enemy {

    constructor(x, y, tileSize, velocity, tileMap, type, ghostSprite) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.velocity = velocity;
        this.tileMap = tileMap;

        this.ghostSprite = ghostSprite;
        this.loadEnemySprites();
        this.type = type;

        //si ha sido comio
        this.isEaten = false;

        //elige una direccion de movimiento aleatoria (entre 0 y 3)
        this.currentMovingDirection = Math.floor(Math.random() * Object.keys(MovingDirection).length);

        //varables de pathfinding
        this.path = [];
        this.pathIndex = 0;
        this.repathTimer = 19; //temporizador hasta volver a calcular un path
        this.repathInterval = 20; //intervalo en el que se hace un repath.

        //coordenada de su esquina
        this.scatterTarget = this.getScatterCorner();

        //timer para animación de pánico
        this.panicAnimationTimer = 0;
        this.panicAnimationInterval = 10;
    }



    random(min, max) {

        return Math.floor(Math.random() * (max - min + 1))  + min;

    }

    //Carga los sprites del fantasma
    loadEnemySprites() {

        const scaredGhost = new Image();
        scaredGhost.src = "images/scared1.png";

        const scaredGhost2 = new Image();
        scaredGhost2.src = "images/scared2.png";

        const ghostEyes = new Image();
        ghostEyes.src = "images/eyes1.png";


        this.ghostSprites = [this.ghostSprite, scaredGhost, scaredGhost2, ghostEyes];

        this.ghostSpriteIndex = 0;

    }

    draw(ctx, pause) {

        if (!pause) {

          this.repathTimer++;

          //si se ha llegado ha superado el tiempo de intervalo
          if (this.repathTimer > this.repathInterval) {

            this.calculatePath(pacman);
            
            this.repathTimer = 0;
          }

          //this.drawTarget(ctx);
          //this.drawPath(ctx);
          this.followPath();
        }

        this.setImage(ctx, mode);

    }

    //cambia la apariencia del fantasma
    setImage(ctx) {

      //primero comprobar si se ha comido
      if (this.isEaten) this.setImageEaten();
        
      else if (mode === "panic") this.setImagePanic();
      
      else this.ghostSpriteIndex = 0;

      ctx.drawImage(
          this.ghostSprites[this.ghostSpriteIndex],
          this.x - 5,
          this.y - 5,
          this.tileSize * 1.55,
          this.tileSize * 1.55
        );
    }

    //controla la apariencia cuando entra en modo pánico
    setImagePanic() {

      //cuando pasan 300ms desde que se activo el powerup
      if (modeTimer >= 300) {
        this.panicAnimationTimer++;

        if(this.panicAnimationTimer >= this.panicAnimationInterval) {
          
          //restear timer
          this.panicAnimationTimer = 0;

          //alternar entre sprites
          if(this.ghostSpriteIndex == 1) this.ghostSpriteIndex = 2;
          else this.ghostSpriteIndex = 1;
        }
      } else this.ghostSpriteIndex = 1;
    }

    setImageEaten() {

      //cuando pasan 300ms desde que se activo el powerup
      if (modeTimer >= 300) {
        this.panicAnimationTimer++;

        if(this.panicAnimationTimer >= this.panicAnimationInterval) {
          
          //restear timer
          this.panicAnimationTimer = 0;

          //alternar entre sprites
          if(this.ghostSpriteIndex == 3) this.ghostSpriteIndex = 0;
          else this.ghostSpriteIndex = 3;
        }
      } else this.ghostSpriteIndex = 3;
    }


    //Devuelve la posición de forma exacta para cuadrícula.
    //Importante: invierte X, Y porque A* los trabaja así
    getTilePosition() {
      return {
        row: Math.floor(this.y / this.tileSize),
        col: Math.floor(this.x / this.tileSize)}
    }

    //calcula la nueva ruta
    calculatePath(pacman) {
      
      //Se convierte el pathMap a grafo para el uso de la funcion 'search'
      const grid = this.tileMap.pathMap;
      const graph = new Graph(grid);

      //Pos de incicio y final
      let start = this.getTilePosition();
      let end = this.getTargetTile(pacman);

      //En caso de recibir una posicion en la que no se pueda mover, vuleve a su esquina
      if (this.tileMap.pathMap[end.row][end.col] === 0) {
        end = this.scatterTarget;
      }

      //Nodos de incio y final
      let startNode = graph.grid[start.row][start.col];
      let endNode = graph.grid[end.row][end.col];

      this.path = astar.search(graph, startNode, endNode);
      this.pathIndex = 0;

    }

    //sigue la ruta definida
    followPath() {

      //si el path está vacío o no hay más paths en el array
      if (this.path.length === 0 || this.pathIndex >= this.path.length) return;

      const node = this.path[this.pathIndex];

      //posicion del destino
      const targetX = node.y * this.tileSize;
      const targetY = node.x * this.tileSize;

      //distancia al destino
      const dx = targetX - this.x;
      const dy = targetY - this.y;

      if (Math.abs(dx) < this.velocity && Math.abs(dy) < this.velocity) {
        this.x = targetX;
        this.y = targetY;
        this.pathIndex++;

      } else {
        if (dx > 0) this.x += this.velocity;
        if (dx < 0) this.x -= this.velocity;
        if (dy > 0) this.y += this.velocity;
        if (dy < 0) this.y -= this.velocity;
      }

    }

    //va a una esquina del mapa
    getScatterCorner() {

      //total de filas y columnas
      const rows = this.tileMap.map.length;
      const cols = this.tileMap.map[0].length;

      //dependiendo de su tipo va a una esquina distinta
      switch (this.type) {

        case GhostType.BLINKY: return { row: 1, col: cols - 2};
        case GhostType.PINKY: return {row: 1, col: 1};
        case GhostType.INKY: return {row: rows - 2, col: cols - 2};
        case GhostType.CLYDE: return {row: rows - 2, col: 1};
      }

    }

    //cuál va a ser el destino dependiendo del modo de movimiento
    getTargetTile(pacman) {

      const rows = this.tileMap.pathMap.length;
      const cols = this.tileMap.pathMap[0].length;
      
      
      //Modo "scatter"
      if (mode === "scatter") return this.scatterTarget;

      //Modo de pánico
      else if (mode === "panic") return {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols)
      };

      //Modo "chase"
      else if (mode === "chase") {
        this.isEaten = false; 
        return pacman.getTilePosition();
      }
      
    }

    //combrueba si colisiona con el jugador
    collideWith(pacman) {

      const size = this.tileSize;

      if (this.x < pacman.x + size && 
          this.x + size > pacman.x &&
          this.y < pacman.y + size && 
          this.y + size > pacman.y
      ) {
        return true;
      }
      else return false;
    }
}

//////////
//TILE MAP
//////////
class TileMap {
  constructor(tileSize) {
    this.tileSize = tileSize;

    this.sprites = new Image();
    this.sprites.src = "images/sprites.png";

    this.mapTiles = new Image();
    this.mapTiles.src = "images/map.png";
  }
  // prefijo 0 - dots
  // prefijo 1 - paredes exteriores
  // prefijo 2 - paredes interiores
  // prefijo 3 - vacio
  // prefijo 4 - Pac-Man
  // prefijo 5 - Fantasma - BLINKY
  // prefijo 6 - Fantasma - PINKY
  // prefijo 7 - Fantasma - INKY
  // prefijo 8 - Fantasma - CLYDE
  // prefijo 9 - power dots

  map = [
    [
      10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 28, 29, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12,
    ],
    [
      13, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 14,
    ],
    [
      13, 0, 20, 21, 21, 22, 0, 20, 21, 21, 21, 22, 0, 23, 24, 0, 20, 21, 21, 21, 22, 0, 20, 21, 21, 22, 0, 14,
    ],
    [
      13, 0, 23, 1, 1, 24, 0, 23, 1, 1, 1, 24, 0, 23, 24, 0, 23, 1, 1, 1, 24, 0, 23, 1, 1, 24, 0, 14,
    ],
    [
      13, 0, 25, 27, 27, 26, 0, 25, 27, 27, 27, 26, 0, 25, 26, 0, 25, 27, 27, 27, 26, 0, 25, 27, 27, 26, 0, 14,
    ],
    [
      13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14,
    ],
    [
      13, 0, 20, 21, 21, 22, 0, 20, 22, 0, 20, 21, 21, 21, 21, 21, 21, 22, 0, 20, 22, 0, 20, 21, 21, 22, 0, 14,
    ],
    [
      13, 0, 25, 27, 27, 26, 0, 23, 24, 0, 25, 27, 27, 22, 20, 27, 27, 26, 0, 23, 24, 0, 25, 27, 27, 26, 0, 14,
    ],
    [
      13, 9, 0, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 0, 9, 14,
    ],
    [
      15, 17, 17, 17, 17, 18, 0, 23, 25, 21, 21, 22, 0, 23, 24, 0, 20, 21, 21, 26, 24, 0, 19, 17, 17, 17, 17, 16,
    ],

    [
      1, 1, 1, 1, 1, 13, 0, 23, 20, 27, 27, 26, 0, 25, 26, 0, 25, 27, 27, 22, 24, 0, 14, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 13, 0, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 24, 0, 14, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 13, 0, 23, 24, 0, 220, 221, 222, 223, 223, 224, 221, 225, 0, 23, 24, 0, 14, 1, 1, 1, 1, 1,
    ],
    //cuarto fantasmas
    [
      11, 11, 11, 11, 11, 110, 0, 25, 26, 0, 226, 1, 1, 1, 1, 1, 1, 227, 0, 25, 26, 0, 111, 11, 11, 11, 11, 11,
    ],
    [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 226, 1, 1, 1, 1, 1, 1, 227, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
      17, 17, 17, 17, 17, 18, 0, 20, 22, 0, 226, 1, 1, 1, 1, 1, 1, 227, 0, 20, 22, 0, 19, 17, 17, 17, 17, 17,
    ],
    
    [
      1, 1, 1, 1, 1, 13, 0, 23, 24, 0, 228, 229, 229, 229, 229, 229, 229, 2210, 0, 23, 24, 0, 14, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 13, 0, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 24, 0, 14, 1, 1, 1, 1, 1,
    ],
    [
      1, 1, 1, 1, 1, 13, 0, 23, 24, 0, 20, 21, 21, 21, 21, 21, 21, 22, 0, 23, 24, 0, 14, 1, 1, 1, 1, 1,
    ],

    [
      10, 11, 11, 11, 11, 110, 0, 25, 26, 0, 25, 27, 27, 22, 20, 27, 27, 26, 0, 25, 26, 0, 111, 11, 11, 11, 11, 12,
    ],
    [
      13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14,
    ],
    [
      13, 0, 20, 21, 21, 22, 0, 20, 21, 21, 21, 22, 0, 23, 24, 0, 20, 21, 21, 21, 22, 0, 20, 21, 21, 22, 0, 14,
    ],
    [
      13, 0, 25, 27, 22, 24, 0, 25, 27, 27, 27, 26, 0, 25, 26, 0, 25, 27, 27, 27, 26, 0, 23, 20, 27, 26, 0, 14,
    ],
    //spawn pacman
    [
      13, 9, 0, 0, 23, 24, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 23, 24, 0, 0, 9, 14,
    ],
    [
      210, 21, 22, 0, 23, 24, 0, 20, 22, 0, 20, 21, 21, 21, 21, 21, 21, 22, 0, 20, 22, 0, 23, 24, 0, 20, 21, 212,
    ],
    [
      211, 27, 26, 0, 25, 26, 0, 23, 24, 0, 25, 27, 27, 22, 20, 27, 27, 26, 0, 23, 24, 0, 25, 26, 0, 25, 27, 213,
    ],
    [
      13, 0, 0, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 23, 24, 0, 0, 0, 0, 0, 0, 14,
    ],
    [
      13, 0, 20, 21, 21, 21, 21, 26, 25, 21, 21, 22, 0, 23, 24, 0, 20, 21, 21, 26, 25, 21, 21, 21, 21, 22, 0, 14,
    ],
    [
      13, 0, 25, 27, 27, 27, 27, 27, 27, 27, 27, 26, 0, 25, 26, 0, 25, 27, 27, 27, 27, 27, 27, 27, 27, 26, 0, 14,
    ],
    [
      13, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 14,
    ],
    [
      15, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17,17, 17, 17, 17, 17, 17, 17, 17, 17, 16,
    ],
  ];

  //mapa de transparecncias que define terreno caminable(1) o no (0) para el algoritmo A*
  pathMap = [
    [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],

    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    //cuarto fantasmas
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],

    [
      0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ],
    //spawn pacman
    [
      0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0,
    ],
    [
      0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    ],
    [
      0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    ],
    [
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    ],
    [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
];

  
  draw(ctx) {
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map[row].length; column++) {
        let tile = this.map[row][column];
        
        //Power Dot
        if (tile === 9) {
          this.drawTile(
            ctx,
            1260,
            56,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        
        // Límite del mapa - Esquina superior izquierda
        else if (tile === 10) {
          this.drawTile(
            ctx,
            0,
            0,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde superior
        else if (tile === 11) {
          this.drawTile(
            ctx,
            16,
            0,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde superior derecha
        else if (tile === 12) {
          this.drawTile(
            ctx,
            432,
            0,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde izquierdo
        else if (tile === 13) {
          this.drawTile(
            ctx,
            0,
            16,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde derecho
        else if (tile === 14) {
          this.drawTile(
            ctx,
            432,
            16,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde inferior izquierdo
        else if (tile === 15) {
          this.drawTile(
            ctx,
            0,
            144,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde inferior derecho
        else if (tile === 16) {
          this.drawTile(
            ctx,
            432,
            144,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde inferior
        else if (tile === 17) {
          this.drawTile(
            ctx,
            16,
            480,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde interior superior derecha
        else if (tile === 18) {
          this.drawTile(
            ctx,
            80,
            144,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde interior superior izquierda
        else if (tile === 19) {
          this.drawTile(
            ctx,
            352,
            144,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde interior inferior derecha
        else if (tile === 110) {
          this.drawTile(
            ctx,
            80,
            208,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Límite del mapa - Borde interior inferior izquierda
        else if (tile === 111) {
          this.drawTile(
            ctx,
            352,
            208,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde superior izquierda
        else if (tile === 20) {
          this.drawTile(
            ctx,
            32,
            32,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde superior
        else if (tile === 21) {
          this.drawTile(
            ctx,
            48,
            32,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde superior derecha
        else if (tile === 22) {
          this.drawTile(
            ctx,
            80,
            32,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde izquieda
        else if (tile === 23) {
          this.drawTile(
            ctx,
            32,
            48,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde derecho
        else if (tile === 24) {
          this.drawTile(
            ctx,
            80,
            48,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde inferor izquierdo
        else if (tile === 25) {
          this.drawTile(
            ctx,
            32,
            64,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde inferor derecho
        else if (tile === 26) {
          this.drawTile(
            ctx,
            80,
            64,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde inferor
        else if (tile === 27) {
          this.drawTile(
            ctx,
            48,
            64,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union izquierda
        else if (tile === 28) {
          this.drawTile(
            ctx,
            208,
            0,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union derecha
        else if (tile === 29) {
          this.drawTile(
            ctx,
            224,
            0,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union izquierda abajo
        else if (tile === 210) {
          this.drawTile(
            ctx,
            0,
            384,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union izquierda arriba
        else if (tile === 211) {
          this.drawTile(
            ctx,
            0,
            400,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union derecha arriba
        else if (tile === 212) {
          this.drawTile(
            ctx,
            432,
            384,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Union derecha abajo
        else if (tile === 213) {
          this.drawTile(
            ctx,
            432,
            400,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Esquina superior izquierda Fantasmas
        else if (tile === 220) {
          this.drawTile(
            ctx,
            160,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde superior Fantasmas
        else if (tile === 221) {
          this.drawTile(
            ctx,
            176,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde puerta izquierda Fantasmas
        else if (tile === 222) {
          this.drawTile(
            ctx,
            192,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Puerta Fantasmas
        else if (tile === 223) {
          this.drawTile(
            ctx,
            208,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde puerta derecha Fantasmas
        else if (tile === 224) {
          this.drawTile(
            ctx,
            240,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Esquina superior derecha Fantasmas
        else if (tile === 225) {
          this.drawTile(
            ctx,
            272,
            192,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde izquierdo Fantasmas
        else if (tile === 226) {
          this.drawTile(
            ctx,
            160,
            208,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde derecho Fantasmas
        else if (tile === 227) {
          this.drawTile(
            ctx,
            272,
            208,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Esquina inferior izquierda Fantasmas
        else if (tile === 228) {
          this.drawTile(
            ctx,
            160,
            256,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Borde Inferior Fantasmas
        else if (tile === 229) {
          this.drawTile(
            ctx,
            176,
            256,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Bordes interiores - Esquina inferior derecha Fantasmas
        else if (tile === 2210) {
          this.drawTile(
            ctx,
            272,
            256,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }

        // dot
        else if (tile === 0) {
          this.drawTile(
            ctx,
            1276,
            56,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }
        // Vacío
        else if (tile === 3) {
          this.drawTile(
            ctx,
            1313,
            404,
            16,
            16,
            column,
            row,
            this.tileSize,
            this.tileSize
          );
        }

        // descomentar esto para tener una cuadricula de cada tile
        /*
        ctx.strokeStyle = "yellow";
        ctx.strokeRect(
          column * this.tileSize,
          row * this.tileSize,
          this.tileSize,
          this.tileSize
        );
        */
      }
    }
  }

  // el sx y el sy se refieren a partir de que coordenada en la imagen se dibuja el tile (source x, source y)
  drawTile(ctx, sx, sy, sw, sh, column, row, size) {
    ctx.drawImage(
      this.mapTiles,
      sx,
      sy,
      sw,
      sh,
      column * this.tileSize,
      row * this.tileSize,
      size,
      size
    );
  }

  getPacman(velocity) {
    for (let row = 0; row < this.map.length; row++) {
      for (let column = 0; column < this.map[row].length; column++) {
        let tile = this.map[row][column];
        if (tile === 4) {
          this.map[row][column] = 0;
          return new Pacman(
            column * this.tileSize,
            row * this.tileSize,
            this.tileSize,
            velocity,
            this
          );
        }
      }
    }
  }

  getEnemies(velocity) {

    const enemies = [];

    for (let row=0; row < this.map.length; row++) {
        for(let column =0; column < this.map[row].length; column++) {
            const tile = this.map[row][column];
            //Blinky
            if(tile === 5) {
                this.map[row][column] = 3;
                enemies.push(
                    new Enemy(
                        column * this.tileSize, 
                        row * this.tileSize, this.tileSize, 
                        velocity, 
                        this, GhostType.BLINKY, redGhost)
                );
                
            }

            //Pinky
            if(tile === 6) {
                this.map[row][column] = 3;
                enemies.push(
                    new Enemy(
                        column * this.tileSize, 
                        row * this.tileSize, this.tileSize, 
                        velocity - 0.2, 
                        this, GhostType.PINKY, pinkGhost)
                );
                
            }

            //Inky
            if(tile === 7) {
                this.map[row][column] = 3;
                enemies.push(
                    new Enemy(
                        column * this.tileSize, 
                        row * this.tileSize, this.tileSize, 
                        velocity - 0.4, 
                        this, GhostType.INKY, blueGhost)
                );
                
            }

            //Clyde
            if(tile === 8) {
                this.map[row][column] = 3;
                enemies.push(
                    new Enemy(
                        column * this.tileSize, 
                        row * this.tileSize, this.tileSize, 
                        velocity - 0.6, 
                        this, GhostType.CLYDE, orangeGhost)
                );
                
            } 
        }
    }

    return enemies;
  }

  setCanvasSize(canvas) {
    canvas.width = this.map[0].length * this.tileSize;
    canvas.height = this.map.length * this.tileSize;
  }

  didCollideWithWall(x, y, direction) {
    if (direction == null) {
      return;
    }
    if (
      Number.isInteger(x / this.tileSize) &&
      Number.isInteger(y / this.tileSize)
    ) {
      let column = 0;
      let row = 0;
      let nextColumn = 0;
      let nextRow = 0;

      switch (direction) {
        case MovingDirection.right:
          nextColumn = x + this.tileSize;
          column = nextColumn / this.tileSize;
          row = y / this.tileSize;
          break;
        case MovingDirection.left:
          nextColumn = x - this.tileSize;
          column = nextColumn / this.tileSize;
          row = y / this.tileSize;
          break;
        case MovingDirection.up:
          nextRow = y - this.tileSize;
          row = nextRow / this.tileSize;
          column = x / this.tileSize;
          break;
        case MovingDirection.down:
          nextRow = y + this.tileSize;
          row = nextRow / this.tileSize;
          column = x / this.tileSize;
          break;
      }
      const tile = this.map[row][column];
      //ignora ciertos tiles, como los dots o el vacío
      if (tile === 0 || tile === 3 || tile === 9) {
        return false;
      }
      return true;
    }
  }
  
  eatTilemapDot(x, y) {
    const row = y / this.tileSize;
    const column = x / this.tileSize;
    if (Number.isInteger(row) && Number.isInteger(column)) {
      //si es un dot
      if (this.map[row][column] === 0) {
        this.map[row][column] = 3; //sustituir por espacio en blanco
        return true;
      }
    }
    return false;
  }

  eatTilemapPowerDot(x, y) {
    const row = y / this.tileSize;
    const column = x / this.tileSize;
    if (Number.isInteger(row) && Number.isInteger(column)) {
      //si es un power_dot
      if (this.map[row][column] === 9) {
        this.map[row][column] = 3; //sustituir por espacio en blanco
        return true;
      }
    }
    return false;

  }
}

//////
//GAME
//////


//Objetos del juego
const tileSize = 16;
const velocity = 2;

let tileMap; //tilemap
let pacman; //pacman
let enemies; //array fantasmas

//velocidad de los fantasmas
//también afecta a la frecuencia de cambio de modo de movimiento
let ghostSpeed = 1.5;

//Modo de movimiento de los fantasmas
//  scatter -- Los fantasmas vuelven a su esquina. Se "dispersan". Cambia cada 150ms
//  chase -- Persiguen a Pac-Man. Cambia cada 300ms
//  panic -- Eligen un destino aleatorio. Dura 600ms

let mode = "chase";
let modeTimer = 0;

//Elementos HTML 
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("score");
const liveboard = document.getElementById("lives");
const hint = document.getElementById("hint");
const bonus = document.getElementById("bonus");


//Sprites fantasmas
const redGhost = new Image();
redGhost.src = "images/red1.png";

const blueGhost = new Image();
blueGhost.src = "images/blue1.png";

const pinkGhost = new Image();
pinkGhost.src = "images/pink1.png";

const orangeGhost = new Image();
orangeGhost.src = "images/orange1.png";

//Sonidos
const sirenAudio = new Audio("sfx/siren0_firstloop.wav")
const panicAudio = new Audio("sfx/fright_firstloop.wav");
const deathAudio = new Audio("sfx/death_0.wav");
const bonusAudio = new Audio("sfx/eat_fruit.wav");
const extraLifeAudio = new Audio("sfx/extend.wav");

sirenAudio.loop = true;
panicAudio.loop = true;

//Variables de estado y puntuación
let isPaused = false;
let score = 0;
let lives = 3;
let canGetLife = true;
let combo = 0;

const totalDots = 295; //todos los puntitos del mapa: 295
let dotsEaten = 0;

//inicializadores
function initGame() {

  hint.innerHTML = "Use the arrow keys to move!";
  hint.style = "color: white";
  isPaused = false;

  mode = "chase";
  modeTimer = 0;

  //Tile de Pac-Man (4) y su posición el mapa
  tileMap.map[23][14] = 4;

  //Tiles de fantasmas (5 al 8) y su posición en el mapa
  tileMap.map[1][1] = 5;
  tileMap.map[1][26] = 6;
  tileMap.map[29][1] = 7;
  tileMap.map[29][26] = 8;

  //Iniciar clase Pac-Man
  pacman = tileMap.getPacman(velocity);
  //Iniciar el array de enemigos
  enemies = tileMap.getEnemies(ghostSpeed);
}

function initMap() {

  //Crea un tile-map del tamaño especificado
  tileMap = new TileMap(tileSize);

}

//Loop principal
function gameLoop() {

  //ordenes de dibujado:
  //1. Mapas
  //2. Mensaje
  //4. Pacman
  //3. Enemigos
  tileMap.draw(ctx);

  pacman.draw(ctx, pause(), enemies);
  enemies.forEach((enemy) => enemy.draw(ctx, pause())); //se inicia una vez se mueve pacman
  
  if (!pause()) {

    //manejo de modo de movimiento de los fantasmas
    if (mode === "chase") {

      sirenAudio.play();

      if (modeTimer > 300) {
        mode = "scatter";
        modeTimer = 0;
      }

    } else if (mode === "scatter" && modeTimer > 150) {

      mode = "chase";
      modeTimer = 0;


    } else if (mode === "panic" && modeTimer > 500) {

      panicAudio.pause();
      mode = "chase";
      modeTimer = 0;
      combo = 0;
    }

    modeTimer++;

    //comprobar perder
    collideWithGhost();
    //comprobar ganar
    levelBeaten();
    //comprobar vida extra
    checkExtraLife();

    scoreboard.innerHTML = "Score: " + score;
    liveboard.innerHTML = "Lives: " + lives;
    
  }


}

function collideWithGhost() {
  enemies.forEach(enemy => {

    if (enemy.collideWith(pacman)){
      if (mode === "panic") {
        pacman.eatGhost(enemy);
      } else {
        isGameOver();
      }
    }
  });
}

function isGameOver() {

  lives--;

  //obligar al juego a parar
  isPaused = true;

  //finalizar audio
  deathAudio.play();
  endAudio();

  //si no quedan vidas el juego para, sino se reinician las entidades
  if (lives > 0) {

    //reiniciar pos de enemigos y pacman tras 2 segundos
    setTimeout(initGame, 1500);

  } else {
    isPaused = true;
    hint.innerHTML = "GAME OVER";
    hint.style = "color: red";
  }
}

function levelBeaten() {
  if (dotsEaten === totalDots) {

    //obligar al juego a parar
    isPaused = true;
    endAudio();

    //reiniciar contador
    dotsEaten = 0;
    //reiniciar mapa y enemigos
    ghostSpeed += 0.1; //aumenta un poco la velocidad cada nivel.

    hint.innerHTML = "LEVEL COMPLETE!";
    hint.style = "color: cyan";
    bonusAudio.play();
    score += 1000;
    showBonusUI(1000);

    //reiniciar pos de enemigos, pacman y mapa tras 2 segundos
    setTimeout(initMap, 2000);
    setTimeout(initGame, 2000);
  }
}

function checkExtraLife() {
  if (score >= 10000 && canGetLife) {
    canGetLife = false;
    lives++;
    extraLifeAudio.play();
  }
}

function pause() {;
    return !pacman.madeFirstMove || isPaused;
}

function endAudio() {

  sirenAudio.pause();
  panicAudio.pause();

}

function showBonusUI(points) {
  bonus.innerHTML = "+" + points;
  setTimeout(hideBonusUI, 1000);
}

function hideBonusUI() {
    bonus.innerHTML = " ";
}

initMap();
initGame(ghostSpeed);
tileMap.setCanvasSize(canvas);
setInterval(gameLoop, 1000 / 75);
