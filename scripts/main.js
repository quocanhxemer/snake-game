const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const game = {
  defaultSnakeSize: 20,

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
    this.currentDirection = "";
    this.snake = [{ x: 0, y: 0 }];
    this.snakeLength = 1;
    this.isPlaying = true;
    this.score = 0;
    this.isPaused = true;
    this.commandsList = [];
    this.commandsListLength = 0;

    // Clear remaining elements from previous games
    const oldElemets = $$(".snake-part");
    for (let i = 0; i < oldElemets.length; i++) {
      oldElemets[i].remove();
    }
    $(".food").style.display = "none";
  },

  loadConfig() {
    const data =
      localStorage.getItem("gameConfig") ||
      // Default config
      '{"interval":50,"boxMode":true,"highScore":0,"pauseOnStartup":false,"snakeSize":20}';
    const config = JSON.parse(data);
    Object.assign(this, config);

    // Pause on startup handling
    if (!this.pauseOnStartup) {
      this.isPaused = false;
      this.currentDirection = "right";
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
    // Display food element
    $(".food").style.display = "block";

    foodPosition = this.newFoodPosition();
    if (foodPosition) {
      Object.assign($(".food").style, {
        fontSize: `${this.snakeSize}px`,
        top: `${foodPosition.y * this.snakeSize}px`,
        left: `${foodPosition.x * this.snakeSize}px`,
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

      foodX = Math.floor(Math.random() * this.gameBoardSize.width);
      foodY = Math.floor(Math.random() * this.gameBoardSize.height);
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

      // Handle snake border
      let borderTop = true,
        borderBottom = true,
        borderLeft = true,
        borderRight = true;
      if (index < this.snakeLength - 1) {
        if (this.snake[index].x === this.snake[index + 1].x) {
          if (this.snake[index].y > this.snake[index + 1].y) {
            borderTop = false;
          } else {
            borderBottom = false;
          }
        } else {
          if (this.snake[index].x > this.snake[index + 1].x) {
            borderLeft = false;
          } else {
            borderRight = false;
          }
        }
      }
      if (index > 0) {
        if (this.snake[index].x === this.snake[index - 1].x) {
          if (this.snake[index].y > this.snake[index - 1].y) {
            borderTop = false;
          } else {
            borderBottom = false;
          }
        } else {
          if (this.snake[index].x > this.snake[index - 1].x) {
            borderLeft = false;
          } else {
            borderRight = false;
          }
        }
      }

      Object.assign(snakePart.style, {
        width: `${this.snakeSize}px`,
        height: `${this.snakeSize}px`,
        top: `${element.y * this.snakeSize}px`,
        left: `${element.x * this.snakeSize}px`,

        // Draw border
        borderTopStyle: borderTop ? "solid" : "transparent",
        borderBottomStyle: borderBottom ? "solid" : "transparent",
        borderLeftStyle: borderLeft ? "solid" : "transparent",
        borderRightStyle: borderRight ? "solid" : "transparent",
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
        top: newFoodPos.y * this.snakeSize + "px",
        left: newFoodPos.x * this.snakeSize + "px",
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
          if (snakeHead.x >= this.gameBoardSize.width) {
            snakeHead.x = 0;
          } else if (snakeHead.y >= this.gameBoardSize.height) {
            snakeHead.y = 0;
          } else if (snakeHead.x < 0) {
            snakeHead.x = this.gameBoardSize.width - 1;
          } else if (snakeHead.y < 0) {
            snakeHead.y = this.gameBoardSize.height - 1;
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
        this.snake = [{ x: snakeHead.x, y: snakeHead.y - 1 }, ...this.snake];
        break;
      case "right":
        this.snake = [{ x: snakeHead.x + 1, y: snakeHead.y }, ...this.snake];
        break;
      case "down":
        this.snake = [{ x: snakeHead.x, y: snakeHead.y + 1 }, ...this.snake];
        break;
      case "left":
        this.snake = [{ x: snakeHead.x - 1, y: snakeHead.y }, ...this.snake];
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
      snakeHead.x >= this.gameBoardSize.width ||
      snakeHead.y >= this.gameBoardSize.height ||
      snakeHead.x < 0 ||
      snakeHead.y < 0
    ) {
      return 2;
    }

    return 0;
  },

  isCommandLegit(currentDirection, newCommand) {
    if (
      (currentDirection === "up" || currentDirection === "down") &&
      (newCommand === "up" || newCommand === "down")
    ) {
      return false;
    } else if (
      (currentDirection === "right" || currentDirection === "left") &&
      (newCommand === "right" || newCommand === "left")
    ) {
      return false;
    }
    return true;
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

    while (
      this.commandsListLength &&
      !this.isCommandLegit(this.currentDirection, this.commandsList[0])
    ) {
      this.commandsList.shift();
      this.commandsListLength--;
    }

    if (this.commandsListLength) {
      this.currentDirection = this.commandsList.shift();
      this.commandsListLength--;
    }
  },

  addCommandsList(command) {
    switch (command) {
      case "up":
        this.commandsList.push("up");
        this.commandsListLength++;
        break;
      case "right":
        this.commandsList.push("right");
        this.commandsListLength++;
        break;
      case "down":
        this.commandsList.push("down");
        this.commandsListLength++;
        break;
      case "left":
        this.commandsList.push("left");
        this.commandsListLength++;
        break;
    }

    this.isPaused = false;
  },

  end() {
    clearInterval(this.intervalId);
    this.isPlaying = false;
    this.highScore = this.score > this.highScore ? this.score : this.highScore;
    this.showMenu();
  },

  save() {
    // Only save when menu displays (?)
    if ($("#menu").style.display === "none") {
      return;
    }

    // Get snake size
    // A bit bulky, might fix later
    const snakeSizeOptions = document.getElementsByName("snake-size");
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
      snakeSize: snakeSizeInput || this.defaultSnakeSize,
    };
    const data = JSON.stringify(config);
    localStorage.setItem("gameConfig", data);
  },

  retry() {
    this.end();
    $("#menu").style.display = "none";
    this.start();
  },

  showMenu() {
    $("#menu").style.display = "block";
    $("#controller-pad").style.display = "none";
    this.handleSettings();
  },

  handleSettings() {
    $("#menu__score").innerText = this.score;
    $("#menu__high-score").innerText = this.highScore;

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
      this.save();
      this.retry();
    };

    $("#data-delete").onclick = () => {
      localStorage.removeItem("gameConfig");
      this.loadConfig();
      this.showMenu();
    };
  },
};

game.start();

$(".quit.btn").onclick = () => {
  game.end();
};

const pauseToggle = $$(".pause-play.btn");
for (let i = 0; i < pauseToggle.length; i++) {
  pauseToggle[i].onclick = () => {
    game.isPaused = !game.isPaused;
  };
}

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
      game.save();
      game.retry();
      break;
  }
});
