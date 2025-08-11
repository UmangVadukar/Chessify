    let game = new Chess();
    let board;
    let moves = [];
    let currentMoveIndex = 0;

    function playMoveSound() {
      const sound = document.getElementById("moveSound");
      if (sound) {
        sound.currentTime = 0;
        sound.play();
      }
    }


    const pieceThemes = {
      classic: piece => `https://raw.githubusercontent.com/jbkunst/chessboardjs-themes/refs/heads/master/chesspieces/wikipedia/${piece}.png`,
      symbol: piece => `https://raw.githubusercontent.com/jbkunst/chessboardjs-themes/refs/heads/master/chesspieces/symbol/${piece}.png`,
      alpha: piece => `https://raw.githubusercontent.com/jbkunst/chessboardjs-themes/refs/heads/master/chesspieces/alpha/${piece}.png`,
      chess24: piece => `https://raw.githubusercontent.com/jbkunst/chessboardjs-themes/refs/heads/master/chesspieces/chess24/${piece}.png`,
    };

    document.getElementById('pieceSet').addEventListener('change', e => {
      const themeFunc = pieceThemes[e.target.value];
      const config = {
        draggable: true,
        position: 'start',
        showNotation: true,
        pieceTheme: themeFunc,
        onDrop: function (source, target) {
          const fenBefore = game.fen();

          const move = game.move({ from: source, to: target, promotion: 'q' });
          if (move === null) return 'snapback';

          const fenAfter = game.fen();

          move.captured ? document.getElementById('captureSound').play() : playMoveSound();
          currentMoveIndex = game.history().length;
          moves = game.history();
          renderMoveList();

          document.getElementById('engineOutput').textContent = 'Analyzing move...';

          analyzeMove(
            fenAfter,
            move, // { from: "e2", to: "e4", san: "e4" }
            {
              depth: 12

              , multiPV: 2
            },
            function (result) {
              let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
              result.topLinesAfter.forEach((line, idx) => {
                output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
              });

              document.getElementById('engineOutput').textContent = output;

              highlightBestMoveSquares(result.bestMoveAfter);


            }
          );




        }
      };


      board = Chessboard('myBoard', config);
    });


    function isCastlingPathClear(color, side) {
      if (color === 'w') {
        if (side === 'kingside') {
          return !game.get('f1') && !game.get('g1');
        } else if (side === 'queenside') {
          return !game.get('d1') && !game.get('c1') && !game.get('b1');
        }
      } else {
        if (side === 'kingside') {
          return !game.get('f8') && !game.get('g8');
        } else if (side === 'queenside') {
          return !game.get('d8') && !game.get('c8') && !game.get('b8');
        }
      }
      return false; // fallback
    }

    // Updated chess board configuration with move analysis
    const config = {
      draggable: true,
      position: 'start',
      showNotation: true,
      pieceTheme: pieceThemes.classic,
      onDrop: function (source, target) {
        // 1. Detect manual castling attempt before calling game.move()
        const piece = game.get(source); // get piece on source square, e.g. 'wK'

        if (piece && piece.type === 'k') {
          const color = piece.color; // 'w' or 'b'
          // king moves two squares horizontally → castling attempt
          const fileFrom = source.charCodeAt(0);
          const fileTo = target.charCodeAt(0);
          const rankFrom = source.charAt(1);
          const rankTo = target.charAt(1);

          if (rankFrom === rankTo && Math.abs(fileFrom - fileTo) === 2) {
            // This is a castling attempt, validate & do manual castle move

            // Try kingside castling
            if (target === (piece.color === 'w' ? 'g1' : 'g8')) {
              if (!isCastlingPathClear(color, 'kingside')) {
                // Path blocked → illegal castling
                return 'snapback';
              }
              const rookSource = piece.color === 'w' ? 'h1' : 'h8';
              const rookTarget = piece.color === 'w' ? 'f1' : 'f8';

              // Move king
              game.move({ from: source, to: target, promotion: 'q' });
              // Move rook
              game.move({ from: rookSource, to: rookTarget });

              // Update board position from FEN after castling
              board.position(game.fen());

              // Play sound
              playMoveSound();

              // Update move list and state
              currentMoveIndex = game.history().length;
              moves = game.history();
              renderMoveList();

              // Analyze new position
              const fenAfter = game.fen();
              analyzeMove(
                fenAfter,
                { from: source, to: target, san: 'O-O' },
                { depth: 12, multiPV: 2 },
                function (result) {
                  let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
                  result.topLinesAfter.forEach((line, idx) => {
                    output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
                  });
                  document.getElementById('engineOutput').textContent = output;
                  highlightBestMoveSquares(result.bestMoveAfter);


                }
              );

              return; // done manual castling, skip rest of onDrop
            }

            // Try queenside castling
            if (target === (piece.color === 'w' ? 'c1' : 'c8')) {
              if (!isCastlingPathClear(color, 'queenside')) {
                return 'snapback';
              }
              const rookSource = piece.color === 'w' ? 'a1' : 'a8';
              const rookTarget = piece.color === 'w' ? 'd1' : 'd8';

              // Move king
              game.move({ from: source, to: target, promotion: 'q' });
              // Move rook
              game.move({ from: rookSource, to: rookTarget });

              // Update board position from FEN after castling
              board.position(game.fen());

              // Play sound
              playMoveSound();

              // Update move list and state
              currentMoveIndex = game.history().length;
              moves = game.history();
              renderMoveList();

              // Analyze new position
              const fenAfter = game.fen();
              analyzeMove(
                fenAfter,
                { from: source, to: target, san: 'O-O-O' },
                { depth: 12, multiPV: 2 },
                function (result) {
                  let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
                  result.topLinesAfter.forEach((line, idx) => {
                    output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
                  });
                  document.getElementById('engineOutput').textContent = output;
                  highlightBestMoveSquares(result.bestMoveAfter);


                }
              );

              return; // done manual castling, skip rest of onDrop
            }
          }
        }

        // 2. Otherwise, normal move handling (your existing code)

        const fenBefore = game.fen();

        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';

        const fenAfter = game.fen();

        move.captured ? document.getElementById('captureSound').play() : playMoveSound();
        currentMoveIndex = game.history().length;
        moves = game.history();
        renderMoveList();

        document.getElementById('engineOutput').textContent = 'Analyzing move...';

        analyzeMove(
          fenAfter,
          move, // { from: "e2", to: "e4", san: "e4" }
          { depth: 12, multiPV: 2 },
          function (result) {
            let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
            result.topLinesAfter.forEach((line, idx) => {
              output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
            });

            document.getElementById('engineOutput').textContent = output;

            highlightBestMoveSquares(result.bestMoveAfter);


          }
        );
      }
    };

    board = Chessboard('myBoard', config);


    function flipBoard() {
      board.flip();
    }


    function updateBoard() {
      board.position(game.fen());
      updateMoveListHighlight();
    }

    function nextMove() {
      if (currentMoveIndex < moves.length) {
        const move = game.move(moves[currentMoveIndex++]);
        move?.captured && document.getElementById('captureSound').play();
        playMoveSound();
        updateBoard();

        // Get FEN after the move (current position)
        const fenAfter = game.fen();

        // Run analyzeMove on this position
        analyzeMove(
          fenAfter,
          move,                  // move object returned by chess.js, includes from, to, san etc.
          { depth: 12, multiPV: 2 },
          function (result) {
            // Handle the engine analysis output here
            let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
            result.topLinesAfter.forEach((line, idx) => {
              output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
            });
            document.getElementById('engineOutput').textContent = output;

            // Optional: highlight best move squares on board
            highlightBestMoveSquares(result.bestMoveAfter);
          }
        );
      }
    }

    function prevMove() {
      if (currentMoveIndex > 0) {
        game.undo();
        currentMoveIndex--;
        playMoveSound();
        updateBoard();

        const fenAfter = game.fen();

        const history = game.history({ verbose: true });
        const lastMove = history.length > 0 ? history[history.length - 1] : null;

        analyzeMove(
          fenAfter,
          lastMove,
          { depth: 12, multiPV: 2 },
          function (result) {
            let output = `♟ Current Position Best Move: ${result.bestMoveAfter}\n`;
            result.topLinesAfter.forEach((line, idx) => {
              output += `📋 PV${idx + 1}: ${line.pv} (${line.eval} cp)\n`;
            });
            document.getElementById('engineOutput').textContent = output;

            highlightBestMoveSquares(result.bestMoveAfter);


          }
        );
      }
    }


    function highlightBestMoveSquares(bestMoveAfter) {
      const bestUCI = bestMoveAfter; // e.g. "d1f3"
      const fromSquare = bestUCI.substring(0, 2); // "d1"
      const toSquare = bestUCI.substring(2, 4);   // "f3"

      // Example for chessboard.js (remove existing highlights first)
      document.querySelectorAll('.square-55d63').forEach(sq => {
        sq.classList.remove('highlight-best');
      });
      document.querySelector(`.square-${fromSquare}`).classList.add('highlight-best');
      document.querySelector(`.square-${toSquare}`).classList.add('highlight-best');
    }
    function goToStart() {
      game.reset();
      currentMoveIndex = 0;
      updateBoard();
    }

    function goToEnd() {
      game.reset();
      moves.forEach(move => game.move(move));
      currentMoveIndex = moves.length;
      playMoveSound();
      updateBoard();
    }

    function loadPGN() {
      const pgn = document.getElementById('pgnInput').value;
      game = new Chess();
      if (!game.load_pgn(pgn)) return alert("Invalid PGN");
      moves = game.history();
      currentMoveIndex = 0;
      game.reset();
      board.position(game.fen());
      renderMoveList();
    }

    function renderMoveList() {
      const container = document.getElementById('moveList');
      container.innerHTML = '';
      for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const white = moves[i], black = moves[i + 1] || '';
        const div = document.createElement('div');
        div.className = 'list-group-item move-item';
        div.dataset.index = i;
        div.innerHTML = `<span class="move-number">${moveNum}.</span>
                         <span class="move-text">
                           <span class="text-primary">${white}</span>
                           <span class="text-light">${black}</span>
                         </span>`;
        div.onclick = () => {
          game.reset();
          for (let j = 0; j <= i + 1; j++) if (moves[j]) game.move(moves[j]);
          currentMoveIndex = i + 2;
          updateBoard();
        };
        container.appendChild(div);
      }
      updateMoveListHighlight();
    }

    function updateMoveListHighlight() {
      document.querySelectorAll('.move-item').forEach(item => {
        const i = parseInt(item.dataset.index);
        item.classList.toggle('active', currentMoveIndex - 1 === i || currentMoveIndex - 2 === i);
      });
    }

    const boardThemes = {
      classic: { white: '#f0d9b5', black: '#b58863' },
      brown: { white: '#fae4ae', black: '#d18815' },
      green: { white: '#eaeed0', black: '#779952' },
      blue: { white: '#dee3e6', black: '#51779c' },
      dark: { white: '#dcdcdc', black: '#333333' }
    };

    function updateBoardTheme(themeName) {
      const style = document.createElement('style');
      style.innerHTML = `
        .white-1e1d7 { background-color: ${boardThemes[themeName].white} !important; }
        .black-3c85d { background-color: ${boardThemes[themeName].black} !important; }
      `;
      document.getElementById('board-theme-style')?.remove();
      style.id = 'board-theme-style';
      document.head.appendChild(style);
    }

    document.getElementById('boardThemeSelector').addEventListener('change', function () {
      updateBoardTheme(this.value);
    });



    let openings = [];
    let openingsToRender = [];

    function loadOpeningsFromJSON() {
      fetch('csvjson.json')
        .then(response => response.json())
        .then(data => {
          openings = data;
          openingsToRender = openings; // initially all

          groupedOpenings = openings.reduce((groups, item) => {
            const key = item.Opening.split(",")[0].trim(); // family before comma
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
          }, {});

          console.log(groupedOpenings)
          renderOpeningNav();
          // renderOpeningCards();
        })
        .catch(err => {
          console.error("Failed to load openings.json:", err);
        });
    }

    function renderOpeningNav() {
      const nav = document.getElementById("openingsNav");
      nav.innerHTML = "";
      nav.classList.add("d-flex", "flex-wrap", "gap-2");

      Object.keys(groupedOpenings).forEach(family => {
        const badge = document.createElement("span");
        badge.classList.add("badge", "bg-secondary", "p-2");
        badge.style.cursor = "pointer";
        badge.textContent = family;
        badge.classList.add("rounded-pill");
        badge.onclick = () => {
          // Remove warning class from all badges first
          document.querySelectorAll('.badge').forEach(b => {
            b.classList.remove('bg-primary');
            b.classList.add('bg-secondary'); // reset to original (or whatever default color you use)
          });

          // Change the clicked badge to warning color
          badge.classList.remove('bg-secondary');
          badge.classList.add('bg-primary');

          // Call your function
          showVariations(family);
        };

        nav.appendChild(badge);
      });
    }



    function showVariations(family) {
      const variationsContainer = document.getElementById("variationsList");
      const title = document.getElementById("selectedOpeningTitle");

      title.textContent = family;
      variationsContainer.innerHTML = "";

      groupedOpenings[family].forEach(opening => {
        const col = document.createElement("div");
        col.classList.add("col");
        col.innerHTML = `
      <div class="card opening-card bg-dark text-light border-secondary h-100">
        <div class="card-body">
          <h5 class="card-title text-white">${opening.Opening}</h5>
          <p class="card-text small text-light">
            White win: ${opening["White_win%"]}%<br>
            Black win: ${opening["Black_win%"]}%
          </p>
          <button class="btn btn-outline-primary btn-sm" onclick="loadOpeningPGN('${opening.Moves}')">
            Load Opening
          </button>
        </div>
      </div>
    `;
        variationsContainer.appendChild(col);
      });
    }

    const input = document.getElementById("searchBar");

    input.addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = input.value.toLowerCase().trim();
        openingsToRender = openings.filter(o =>
          o.Opening.toLowerCase().includes(query)
        );
        renderOpeningCards();
      }

    });



    function renderOpeningCards() {
      const container = document.getElementById("variationsList");
      container.innerHTML = ""; // clear previous cards
      openingsToRender.forEach(opening => {
        const col = document.createElement("div");
        col.classList.add("col");
        col.innerHTML = `
      <div class="card opening-card bg-dark text-light border-secondary h-100">
        <div class="card-body">
          <h5 class="card-title text-white">${opening.Opening}</h5>
          <p class="card-text small text-light">
            White win: ${opening["White_win%"]}%<br>
            Black win: ${opening["Black_win%"]}%
          </p>
          <button class="btn btn-outline-primary btn-sm" onclick="loadOpeningPGN('${opening.Moves}')">
            Load Opening
          </button>
        </div>
      </div>
    `;
        container.appendChild(col);
      });
    }
    loadOpeningsFromJSON();

    function loadOpeningPGN(pgn) {
      document.getElementById("pgnInput").value = pgn;
      const boardElement = document.getElementById("myBoard");
      if (boardElement) {
        boardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        loadPGN();

      }
    }




    // Init
    updateBoardTheme('classic');
    loadPGN();


    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        nextMove();
      } else if (e.key === 'ArrowLeft') {
        if (currentMoveIndex > -1) {
          prevMove();
        } else {
          board.start();
          previousHighlightedSquares.forEach(sq => {
            const el = document.querySelector(`.square-${sq}`);
            if (el) el.classList.remove('highlight-square');
          });
        }
      }
    });
