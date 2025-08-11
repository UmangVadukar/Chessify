function analyzeMove(fenAfter, move, options, callback) {
    const worker = new Worker("stockfish-worker.js");
    const depth = options.depth || 12;
    const multiPV = options.multiPV || 2;

    let bestMoveAfter = null;
    let topLinesAfter = [];
    let bestDepthSeen = 0;

    // played move in UCI (from/to + promotion if any)
    const playedMoveUCI = move.from + move.to + (move.promotion || "");

    worker.onmessage = function (e) {
        const msg = e.data;

        // Parse info lines that include depth, multipv, score and pv in one go
        const infoMatch = msg.match(/info depth (\d+).*?multipv (\d+).*?score (cp|mate) (-?\d+).*?pv (.+)/);
        if (infoMatch) {
            const depthNum = parseInt(infoMatch[1], 10);
            const pvNum = parseInt(infoMatch[2], 10);
            const scoreType = infoMatch[3];
            const scoreVal = parseInt(infoMatch[4], 10);
            const pvString = infoMatch[5].trim();

            const evalValue = scoreType === "mate"
                ? (scoreVal > 0 ? 10000 : -10000)
                : scoreVal;

            // If we see a deeper depth, reset stored PVs (we only want PVs from the deepest depth)
            if (depthNum > bestDepthSeen) {
                bestDepthSeen = depthNum;
                topLinesAfter = [];
                bestMoveAfter = null;
            }

            // Only store PVs that belong to the current deepest depth
            if (depthNum === bestDepthSeen) {
                if (pvNum === 1) {
                    bestMoveAfter = pvString.split(" ")[0]; // first move of PV1
                }
                if (pvNum <= multiPV) {
                    topLinesAfter[pvNum - 1] = { pv: pvString, eval: evalValue };
                }
            }
        }

        // When search finishes, engine sends bestmove
        if (msg.startsWith("bestmove")) {
            // fallback: if for some reason bestMoveAfter is null, parse bestmove string
            const bmMatch = msg.match(/^bestmove\s+(\S+)/);
            const finalBest = bmMatch ? bmMatch[1] : bestMoveAfter;
            if (!bestMoveAfter) bestMoveAfter = finalBest;

            callback({
                bestMoveAfter,
                topLinesAfter,
                playedMove: playedMoveUCI,
                depth: bestDepthSeen
            });

            worker.terminate();
        }
    };

    // Start engine (ensure MultiPV set before go)
    worker.postMessage("uci");
    worker.postMessage(`setoption name MultiPV value ${multiPV}`);
    worker.postMessage("ucinewgame");
    worker.postMessage(`position fen ${fenAfter}`);
    worker.postMessage(`go depth ${depth}`);
}
