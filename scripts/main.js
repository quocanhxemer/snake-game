const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const game = {
  start() {
    this.init();
    this.loadConfig();

    this.drawGameBoard();
    this.drawSnake();
    this.handleSnakeControl();

    this.intervalId = setInterval(() => {
      this.handleSnakeControl();
      this.moveSnake();
    }, this.interval);
  },

  init() {
    this.gameBoard = $("#game-board");
    this.gameBoardSize = { height: 0, width: 0 };
    this.snakeSize = 20;
    this.defaultSnakeSize = 20;
    this.currentDirection = "";
    this.snake = [{ x: 0, y: 0 }];
    this.snakeLength = 1;
    this.isPlaying = true;
    this.score = 0;
    this.isPaused = true;
    this.commandsList = [];
    this.commandsListLength = 0;

    // Clear remaining elements from previous games
    const oldElemets = $$(".snake-part,.food");
    for (let i = 0; i < oldElemets.length; i++) {
      oldElemets[i].remove();
    }
  },

  loadConfig() {
    const data =
      localStorage.getItem("snake-game") ||
      // Default config
      '{"interval":50,"boxMode":true,"highScore":0,"pauseOnStartup":false,"snakeSize":20}';
    const config = JSON.parse(data);
    Object.assign(this, config);

    // Pause on startup handling
    if (!this.pauseOnStartup) {
      this.isPaused = false;
      this.commandsList.push("right");
      this.commandsListLength++;
    }
  },

  drawGameBoard() {
    // Somewhat responsive
    while (
      this.gameBoardSize.height * this.snakeSize <=
      window.innerHeight - 200
    ) {
      this.gameBoardSize.height++;
    }
    while (
      this.gameBoardSize.width * this.snakeSize <=
      window.innerWidth - 50
    ) {
      this.gameBoardSize.width++;
    }

    // Render controller buttons
    $("#controller-pad").style.display = "block";

    Object.assign(this.gameBoard.style, {
      height: `${this.gameBoardSize.height * this.snakeSize}px`,
      width: `${this.gameBoardSize.width * this.snakeSize}px`,
      border: this.boxMode ? "5px solid #e75353" : "none",
    });

    this.updateScore();
    this.renderFood();
  },

  renderFood() {
    // Render food element
    this.gameBoard.innerHTML += '<div class="food"></div>';

    foodPosition = this.newFoodPosition();
    if (foodPosition) {
      Object.assign($(".food").style, {
        width: `${this.snakeSize}px`,
        height: `${this.snakeSize}px`,
        top: `${foodPosition.y}px`,
        left: `${foodPosition.x}px`,
      });
    }
  },

  newFoodPosition() {
    let foodX, foodY;
    do {
      // When there is no space left for food rendering
      if (
        this.snakeLength >=
        this.gameBoardSize.height * this.gameBoardSize.width
      ) {
        this.end();
        return null;
      }

      foodX =
        (Math.random() * (this.gameBoardSize.width - 1)).toFixed() *
        this.snakeSize;
      foodY =
        (Math.random() * (this.gameBoardSize.height - 1)).toFixed() *
        this.snakeSize;
    } while (!this.isLegitFoodPosition(foodX, foodY));

    return {
      x: foodX,
      y: foodY,
    };
  },

  isLegitFoodPosition(foodX, foodY) {
    let check = true;
    this.snake.forEach((snakePart) => {
      if (foodX === snakePart.x && foodY === snakePart.y) {
        check = false;
      }
    });
    return check;
  },

  updateScore() {
    const scoreText = $("#score-display");
    if (scoreText) {
      scoreText.innerText = `Score: ${this.score}`;
    }
  },

  drawSnake() {
    // Clear game board
    const oldSnakePart = $$(".snake-part");
    for (let i = 0; i < oldSnakePart.length; i++) {
      oldSnakePart[i].remove();
    }

    //Draw
    this.snake.forEach((element, index) => {
      this.gameBoard.innerHTML += `<div class="snake-part id-${index}"></div>`;
      const snakePart = $(`.snake-part.id-${index}`);
      Object.assign(snakePart.style, {
        width: `${this.snakeSize}px`,
        height: `${this.snakeSize}px`,
        top: `${element.y}px`,
        left: `${element.x}px`,
      });
    });
  },

  moveSnake() {
    this.advanceHead();
    this.handleCollision();

    if (!this.isPlaying || this.isPaused) {
      return;
    }

    if (!this.isFoodEaten()) {
      this.snake.pop();
    } else {
      this.snakeLength++;
      this.score++;
      this.updateScore();

      const newFoodPos = this.newFoodPosition();
      Object.assign($(".food").style, {
        top: newFoodPos.y + "px",
        left: newFoodPos.x + "px",
      });
    }

    this.drawSnake();
  },

  handleCollision() {
    const collidingStatus = this.isCollided();
    switch (collidingStatus) {
      case 1:
        this.end();
        break;
      case 2:
        if (this.boxMode) {
          this.end();
        } else {
          // Non-boxmode handling
          const snakeHead = this.snake[0];
          if (snakeHead.x >= this.gameBoardSize.width * this.snakeSize) {
            snakeHead.x = 0;
          } else if (
            snakeHead.y >=
            this.gameBoardSize.height * this.snakeSize
          ) {
            snakeHead.y = 0;
          } else if (snakeHead.x < 0) {
            snakeHead.x = (this.gameBoardSize.width - 1) * this.snakeSize;
          } else if (snakeHead.y < 0) {
            snakeHead.y = (this.gameBoardSize.height - 1) * this.snakeSize;
          }
        }
        break;
    }
  },

  advanceHead() {
    if (!this.isPlaying || this.isPaused) {
      return;
    }

    const snakeHead = this.snake[0];
    switch (this.currentDirection) {
      case "up":
        this.snake = [
          { x: snakeHead.x, y: snakeHead.y - this.snakeSize },
          ...this.snake,
        ];
        break;
      case "right":
        this.snake = [
          { x: snakeHead.x + this.snakeSize, y: snakeHead.y },
          ...this.snake,
        ];
        break;
      case "down":
        this.snake = [
          { x: snakeHead.x, y: snakeHead.y + this.snakeSize },
          ...this.snake,
        ];
        break;
      case "left":
        this.snake = [
          { x: snakeHead.x - this.snakeSize, y: snakeHead.y },
          ...this.snake,
        ];
        break;
      default:
        this.isPaused = true;
        break;
    }
  },

  isFoodEaten() {
    if (
      $(".food").style.top === $(".snake-part.id-0").style.top &&
      $(".food").style.left === $(".snake-part.id-0").style.left
    ) {
      return true;
    }
    return false;
  },

  isCollided() {
    const snakeHead = this.snake[0];
    for (let i = 1; i < this.snakeLength; i++) {
      // Snake touches itself
      if (snakeHead.x === this.snake[i].x && snakeHead.y === this.snake[i].y) {
        return 1;
      }
    }

    // Snakes touches game board edge
    if (
      snakeHead.x >= this.gameBoardSize.width * this.snakeSize ||
      snakeHead.y >= this.gameBoardSize.height * this.snakeSize ||
      snakeHead.x < 0 ||
      snakeHead.y < 0
    ) {
      return 2;
    }
    return 0;
  },

  handleSnakeControl() {
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
        case "w":
          this.addCommandsList("up");
          break;
        case "ArrowRight":
        case "d":
          this.addCommandsList("right");
          break;
        case "ArrowDown":
        case "s":
          this.addCommandsList("down");
          break;
        case "ArrowLeft":
        case "a":
          this.addCommandsList("left");
          break;
      }
    });

    $("#controller-pad").onclick = (event) => {
      const buttonClicked = event.target.closest(".control");
      if (!buttonClicked) {
        return;
      }

      const direction = buttonClicked.classList[1];
      this.addCommandsList(direction);
    };

    if (this.commandsListLength) {
      this.currentDirection = this.commandsList.shift();
      this.commandsListLength--;
      this.isPaused = false;
    }
  },

  addCommandsList(command) {
    // Command list takes new array element only when the new command "makes sense"
    switch (command) {
      case "up":
        if (
          (this.commandsListLength &&
            this.commandsList[this.commandsListLength - 1] !== "down" &&
            this.commandsList[this.commandsListLength - 1] !== "up") ||
          (!this.commandsListLength &&
            this.currentDirection !== "down" &&
            this.currentDirection !== "up")
        ) {
          this.commandsList.push("up");
          this.commandsListLength++;
        }
        break;
      case "right":
        if (
          (this.commandsListLength &&
            this.commandsList[this.commandsListLength - 1] !== "left" &&
            this.commandsList[this.commandsListLength - 1] !== "right") ||
          (!this.commandsListLength &&
            this.currentDirection !== "left" &&
            this.currentDirection !== "right")
        ) {
          this.commandsList.push("right");
          this.commandsListLength++;
        }
        break;
      case "down":
        if (
          (this.commandsListLength &&
            this.commandsList[this.commandsListLength - 1] !== "down" &&
            this.commandsList[this.commandsListLength - 1] !== "up") ||
          (!this.commandsListLength &&
            this.currentDirection !== "down" &&
            this.currentDirection !== "up")
        ) {
          this.commandsList.push("down");
          this.commandsListLength++;
        }
        break;
      case "left":
        if (
          (this.commandsListLength &&
            this.commandsList[this.commandsListLength - 1] !== "left" &&
            this.commandsList[this.commandsListLength - 1] !== "right") ||
          (!this.commandsListLength &&
            this.currentDirection !== "left" &&
            this.currentDirection !== "right")
        ) {
          this.commandsList.push("left");
          this.commandsListLength++;
        }
        break;
    }
  },

  end() {
    clearInterval(this.intervalId);
    this.isPlaying = false;
    this.highScore = this.score > this.highScore ? this.score : this.highScore;
    this.showMenu();
  },

  retry() {
    this.end();
    $("#menu").style.display = "none";
    this.start();
  },

  showMenu() {
    $("#menu").style.display = "block";
    $("#controller-pad").style.display = "none";
    $("#menu").innerHTML = `
                    <h3 class="menu__header">game over</h3>
                    <p class="menu__score">Your score: ${this.score}</p>
                    <p class="menu__score">High score: ${this.highScore}</p>
                    <p>Game Settings</p>
                    <label for="speed">
                        Speed
                        <input type="range" name="speed" id="speed" />
                    </label>
                    <label for="box-mode">
                        <input type="checkbox" name="box-mode" id="box-mode" />
                        Box Mode
                    </label>
                    <label for="pause-startup">
                        <input type="checkbox" name="pause-startup" id="pause-startup" />
                        Pause the game on startup
                    </label>
                    <br />
                    Snake size
                    <input type="radio" name="snake-size" id="snake-size-large" value="30">
                    <label for="snake-size-large">Large</label>
                    <input type="radio" name="snake-size" id="snake-size-moderate" value="20">
                    <label for="snake-size-moderate">Moderate</label>
                    <input type="radio" name="snake-size" id="snake-size-small" value="10">
                    <label for="snake-size-small">Small</label>
                    <br />
                    <button id="retry-btn">SAVE AND RETRY (R)</button>
                    <button id="data-delete">DELETE DATA & RESET DEFAULT</button>
                `;
    this.handleSettings();
  },

  handleSettings() {
    $("#speed").value = 2000 / this.interval;
    $("#box-mode").checked = this.boxMode;
    $("#pause-startup").checked = this.pauseOnStartup;

    // A bit bulky, might fix later
    const snakeSizeOptions = document.getElementsByName("snake-size");
    for (let i = 0; i < snakeSizeOptions.length; i++) {
      if (snakeSizeOptions[i].value === this.snakeSize + "") {
        snakeSizeOptions[i].checked = true;
      }
    }

    $("#retry-btn").onclick = () => {
      // Get snake size
      let snakeSizeInput = 0;
      for (let i = 0; i < snakeSizeOptions.length; i++) {
        if (snakeSizeOptions[i].checked) {
          snakeSizeInput = Number(snakeSizeOptions[i].value);
        }
      }

      const config = {
        interval: Number($("#speed").value)
          ? 2000 / Number($("#speed").value)
          : 2000,
        boxMode: $("#box-mode").checked,
        highScore: this.highScore,
        pauseOnStartup: $("#pause-startup").checked,
        snakeSize: snakeSizeInput || 20,
      };
      const data = JSON.stringify(config);
      localStorage.setItem("snake-game", data);

      this.retry();
    };

    $("#data-delete").onclick = () => {
      localStorage.removeItem("snake-game");
      this.loadConfig();
      this.showMenu();
    };
  },
};

game.start();

$("#quit-btn").onclick = () => {
  game.end();
};

$("#pause-btn").onclick = () => {
  game.isPaused = !game.isPaused;
};

// Shortcut handling
document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "q":
      game.end();
      break;
    case "p":
      game.isPaused = !game.isPaused;
      break;
    case "r":
      game.retry();
      break;
  }
});
