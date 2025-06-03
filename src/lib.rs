use wasm_bindgen::prelude::*;
use web_sys::console; 

#[wasm_bindgen()]
pub struct Grid {
    width: u32,
    height: u32,
    cells: Vec<Note>, 
}

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Note {
    C, D, E, F, G, A, B,
}

#[wasm_bindgen()]
impl Grid {
    pub fn new() -> Grid {
        let width = 350;
        let height = 350;

        let cells = vec![Note::E, Note::G, Note::D, Note::B, Note::A, Note::C, Note::F];

        Grid {
            width,
            height,
            cells,
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells(&self) -> js_sys::Array {
        let notes = &self.cells;
        cells_to_arr(notes)
    }

// insertion sort

    // expose each step of sort - state of notes arr after each swap
    pub fn insertion_sort(&self) -> js_sys::Array {
        let mut notes = self.cells.clone();
        let len = notes.len();
        let steps = js_sys::Array::new();
        
        // push initial state
        let state = js_sys::Array::new();
        state.push(&cells_to_arr(&notes));
        state.push(&JsValue::from(-1)); // js indexOf returns -1 if element not present, so here means no swap occured
        state.push(&JsValue::from(-1));
        steps.push(&state);

        // loop through the notes
        for i in 1..len {
            let mut j = i;
            // the comparison - the steps need to be rendered in js canvas
            while j > 0 && notes[j - 1] > notes[j] {
                notes.swap(j - 1, j);
                // the updated state after each step
                steps.push(&make_step(&notes, (j - 1) as i32, j as i32));
                j -= 1;
            }
        }
        steps
    }

// selection sort

    pub fn selection_sort(&self) -> js_sys::Array {
        let mut notes = self.cells.clone();
        let len = notes.len();
        let steps = js_sys::Array::new();

        // push initial state
        let state = js_sys::Array::new();
        state.push(&cells_to_arr(&notes));
        state.push(&JsValue::from(-1)); 
        state.push(&JsValue::from(-1)); 
        steps.push(&state);

        for i in 0..len {
            // assume current element is smallest
            let mut min_idx = i;

            // find idx of smallest element in remaining (unsorted) part of arr
            for j in (i + 1)..len {
                if notes[j] < notes[min_idx] {
                    min_idx = j;
                }
            }

            // swap first unsorted element with found smallest element
            if min_idx != i {
                notes.swap(i, min_idx);
                steps.push(&make_step(&notes, i as i32, min_idx as i32));
            }
        }
        steps
    }

// bubble sort

    pub fn bubble_sort(&self) -> js_sys::Array {
        let mut notes = self.cells.clone();
        let len = notes.len();
        let mut swapped: bool; // used to break early if already sorted
        let steps = js_sys::Array::new();

        let state = js_sys::Array::new();
        state.push(&cells_to_arr(&notes));
        state.push(&JsValue::from(-1)); 
        state.push(&JsValue::from(-1)); 
        steps.push(&state);

        for i in 0..len {
            swapped = false;
            for j in 0..(len - 1 - i) {
                if notes[j] > notes[j + 1] {
                    notes.swap(j, j + 1);
                    steps.push(&make_step(&notes, j as i32, (j + 1) as i32));
                    swapped = true;
                }     
            }
            if !swapped {
                break;
            }
        }
        steps
    }
}

fn make_step(notes: &Vec<Note>, swap_a: i32, swap_b: i32) -> js_sys::Array {
    let state = js_sys::Array::new();
    state.push(&cells_to_arr(&notes));
    state.push(&JsValue::from(swap_a));
    state.push(&JsValue::from(swap_b));
    state
}

fn cells_to_arr(cells: &Vec<Note>) -> js_sys::Array {
    cells
        .iter()
        .map(|note| JsValue::from(note_to_string(note)))
        .collect()
}

fn note_to_string(note: &Note) -> &'static str {
    match note {
        Note::C => "c",
        Note::D => "d",
        Note::E => "e",
        Note::F => "f",
        Note::G => "g",
        Note::A => "a",
        Note::B => "b",
    }
}

#[wasm_bindgen(start)]
fn start() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();

    Ok(())
}

// Call a JavaScript function from Rust
#[wasm_bindgen]
pub fn log_to_console(message: &str) {
    console::log_1(&JsValue::from_str(message));
}