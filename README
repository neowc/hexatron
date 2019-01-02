<p align="center">
    <img src="https://cdn.pbrd.co/images/HUz2DHc.png" width=300 />
</p>

This repository contains the source code for **Hexatron**, the game used in the 2018 AI Challenge, presented in the _UGent Informatica_ course, by prof. Bart Dhoedt.

#### Files in this repository

| Filename | Purpose |
|---|---|
| `game.py` | Contains the actual logic for the Hexatron game. |
| `simulator.py` | Executable to provide an easy way to simulate a game of Hexatron between two agents. |
| `example_agent.py` | An example of a Hexatron agent. |
| `hexagon.js` | Contains the source code for the replay visualizer. |

#### Creating your own agent

A Hexatron AI agent consists of a single Python file, containing at least a method named `generate_move`, having the following signature

```python
def generate_move(board, positions, orientations)
```

__Arguments__

- `board` (_np.array_) The playing field, represented as 3D array.
- `positions` (_list_) A list of your agent's position, as tuple `(x, y)`, as well as your opponent's position.
- `orientations` (_list_) A list of your agent's orientation (as an integer in [0,5]), as well as your opponent's orientation.

__Returns__

An integer in [-2,2].

__Example__

See `example_agent.py` for a basic example of a valid agent.

#### Running the simulator

Run `simulator.py`, followed by the filenames of two Hexatron agents to simulate a game. A replay of the game will be written to `replay.html`.

```bash
python3 simulator.py example_agent.py example_agent.py
```