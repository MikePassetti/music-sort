import init, { log_to_console, Grid } from './pkg/music_sort.js';

async function run() {
    // init func loads .wasm module
    await init();
    log_to_console("WebAssembly module loaded!");

    // construct the grid
    const staff = Grid.new();
    const height = staff.height();
    const width = staff.width();
    const cells = staff.cells();
    console.log("cells: ", cells);

    // construct the canvas
    const canvas = document.getElementById("grid");
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // the size of cells
    const interval = 50;

    // init the sort
    let sortSteps = staff.bubble_sort();
    console.log("sorted cells: ", sortSteps)
    let stepIndex = 0;

    // construct audiocontext, osc n gain
    const audioCtx = new AudioContext();
    let osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
   
    // connect osc to gain to destination(speakers)
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // set gain volume
    gain.gain.value = 0.05;
    
    // pitch n note index
    const pitchIndex = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    const noteIndex = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

    // draws the grid
    function drawGrid() {
        ctx.beginPath();
        
        // draw cols
        for (let x = 0; x <= cells.length; x++) {
            ctx.moveTo(x * interval, 0);
            ctx.lineTo(x * interval, height);
        }
        
        // draw rows
        for (let y = 0; y <= 7; y++) {
            ctx.moveTo(0, y * interval);
            ctx.lineTo(canvas.width, y * interval);
        }
        ctx.stroke();
    }
    
    // maps noteIndex to pitchIndex
    function noteToPitch(note) {
        const idx = noteIndex.indexOf(note);
        return idx !== -1 ? pitchIndex[idx] : null;
    }

    function drawStep(step) {
        const notes = Array.from(step[0]);
        const swapA = step[1];
        const swapB = step[2];

        for (let col = 0; col < notes.length; col++) {
            let note = notes[col];
            let row = noteIndex.indexOf(note);
            if (row === -1) continue;
            let invertedRow = (noteIndex.length - 1) - row;

            // highlight swapped notes
            if (col === swapA || col === swapB) {
                ctx.fillStyle = "red";
            } else {
                ctx.fillStyle = "black";
            }
            ctx.fillRect(col * interval, invertedRow * interval, interval, interval);
            ctx.fillStyle = "white";
            ctx.fillText(note.toUpperCase(), col * interval + 12, invertedRow * interval + 28);
            ctx.fillStyle = "black";
        }
    }

    function playNote(note) {
        const pitch = noteToPitch(note);
        if (pitch !== null) {
            osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
        }
    }

    // animates cells n plays audio for each swap
    function animateSort() {
        resetOscillator();
        if (stepIndex >= sortSteps.length) {
            osc.stop();
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        const step = Array.from(sortSteps[stepIndex]);
        console.log(step)
        drawStep(step);

        // play audio for swapped notes
        gain.gain.value = 0.05;
        const notes = Array.from(step[0]);
        const swapA = step[1];
        const swapB = step[2];
        if (swapA !== -1 && swapB !== -1) {
            // play the pitch of swapped notes
            const noteA = notes[swapA];
            const noteB = notes[swapB];
            const idxA = noteIndex.indexOf(noteA);
            const idxB = noteIndex.indexOf(noteB);
    
            playNote(noteIndex[idxA]);
            playNote(noteIndex[idxB]);
        }

        stepIndex++;
        setTimeout(animateSort, 1000);
    }

    // the osc needs to be remade everytime alg changes as can only call start() once for each audiocontext
    function resetOscillator() {
        if (osc) {
            try { osc.stop(); } catch (e) {}
            osc.disconnect();
        }
        osc = audioCtx.createOscillator();
        osc.connect(gain);
        osc.start();
    }

    function setSelection(selection) {
        if (selection == 'bubble') {
            return staff.bubble_sort()
        } else if (selection == 'insertion') {
            return staff.insertion_sort()
        } else if (selection == 'selection') {
            return staff.selection_sort()
        }
    }

// event listeners

    // inits audio n animation
    const playButton = document.querySelector("button");
    playButton.addEventListener(
        "click", () => {
            // check if context is in suspended state
            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }

            // play or pause depending on state
            if (playButton.dataset.playing === "false") {
                resetOscillator();
                playButton.dataset.playing = "true";
                animateSort();
            } else if (playButton.dataset.playing === "true") {
                playButton.dataset.playing = "false";
                if (osc) {
                    try { osc.stop(); } catch (e) {}
                    osc.disconnect();
                }
            }
        },
        false,
    );

    // select the alg
    const sortOption = document.querySelector("select");
    sortOption.addEventListener("change", (e) => {
        const selection = e.target.value;
        sortSteps = setSelection(selection);
        stepIndex = 0;
        console.log("changed to: ", selection, sortSteps);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
    })

    drawGrid();
}

run();
