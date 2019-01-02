'use strict';

/**
 * Represent a hexagonal grid using D3.js. The trajectories of two players
 * can be added to the grid, and be displayed for a given timestep.
 */
class HexagonGrid {

  /**
   * Initialize the hexagon grid to `elem`.
   * @constructor
   * @param {string} selector Id of the element to add the SVG to.
   * @param {number} gridSize Size of the 2D grid, that will contain the
   *  hexagonal playing field.
   * @param {Object} [options] Additional options to the constructor.
   * @param {boolean} [options.drawCorners] Display the (unreachable) top left corder
   *  and bottom right corner of the grid. Default is false;
   * @param {boolean} [options.drawText] Display the coordinates in each cell.
   *  Default is false.
   * @param {number} [options.elemWidth] By default, the size of the hexagons
   *  is based on the size of the screen, and the containing SVG has a width
   *  and hight accordingly. By setting `elemWidth`, the size of the SVG is
   *  fixed, and the hexagons are rescaled to fit.
   * @param {number} [options.hexagonWidth] Specify a fixed width for a single
   *  hexagon. The SVG will be scaled accordingly.
   */
  constructor(selector, gridSize, options = {}) {
    this.gridSize = gridSize;
    this.halfSize = Math.floor(gridSize / 2);

    this.drawCorners = options.drawCorners || false;
    this.drawText = options.drawText || false;

    if (options.elemWidth) {
      this.hexagonWidth = (options.elemWidth - 10) /
        (this.gridSize + this.halfSize);
      this.hexagonSize = this.hexagonWidth / Math.sqrt(3);
    } else if (options.hexagonWidth) {
      this.hexagonWidth = options.hexagonWidth;
      this.hexagonSize = this.hexagonWidth / Math.sqrt(3);
    } else {
      this.hexagonSize = Math.floor(window.innerWidth * 0.6 / gridSize / 2);
      this.hexagonWidth = Math.sqrt(3) * this.hexagonSize;
    }

    this.hexagonHeight = 2 * this.hexagonSize;
    this.textSize = 0.8 * this.hexagonSize;

    this.elem = d3.select(selector)
      .append('svg')
      .attr('width',
        10 + gridSize * this.hexagonWidth + this.halfSize * this.hexagonWidth)
      .attr('height',
        10 + this.hexagonHeight * 1/4 + gridSize * this.hexagonHeight * 3/4);

    /** @type {function} */
    this._hexagonPathGenerator = d3.line()
      .x(d => d.x)
      .y(d => d.y);

    /** @type {function} */
    this._trianglePathGenerator = d3.symbol()
      .type(d3.symbolTriangle)
      .size(3 * this.hexagonHeight);

    this._draw();
  }

  /**
   * Generate the corners for a hexagon with center (x, y).
   * @param {number} x X coordinate of the hexagon center.
   * @param {number} y Y coordinate of the hexagon center.
   * @returns {Object[]} corners A list of 7 points.
   * @returns {number} corners[].x X coordinate of the corner.
   * @returns {number} corners[].y Y coordinate of the corner.
   */
  _getPoints(x, y) {
    return [...Array(7).keys()].map(i => {
      const angle = (i * 60 - 30) * Math.PI / 180;
      return {
        x: x + this.hexagonSize * Math.cos(angle),
        y: y + this.hexagonSize * Math.sin(angle)};
    });
  }

  /**
   * Return whether or not a cell with index i, j belongs to the top left
   *  or bottom right corner.
   * @param {number} i The row index.
   * @param {number} j The column index.
   * @returns {boolean}
   */
  _isCornerCell(i, j) {
    return i + j < this.halfSize || i + j >= this.gridSize + this.halfSize;
  }

  /**
   * Draw the hexagonal grid.
   */
  _draw() {
    this.grid = [];

    for (let i = 0; i < this.gridSize; i++) {
      const row = [];

      const y = this.hexagonHeight/2 + 5 + i * this.hexagonHeight * 3/4;
      const x_offset = i * this.hexagonWidth/2;

      for (let j = 0; j < this.gridSize; j++) {

        if (this._isCornerCell(i, j) && !this.drawCorners) {
          row.push(null);
          continue;
        }

        const x = this.hexagonWidth/2 + 5 + j * this.hexagonWidth;

        const points = this._getPoints(x + x_offset, y);

        const hexagon = this.elem.append('path')
          .attr('d', this._hexagonPathGenerator(points))
          .attr('stroke', 'grey')
          .attr('stroke-width', 2)
          .attr('fill', () => this._isCornerCell(i, j) ? '#ff9482' : 'none');

        row.push({x: x + x_offset, y: y, hexagon: hexagon});

        if (!this.drawText) {
          continue;
        }

        this.elem.append('text')
          .attr('x', x + x_offset)
          .attr('y', y)
          .attr('font-family', 'sans-serif')
          .attr('font-size', '12px')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .text(`${i},${j}`);
      }

      this.grid.push(row);
    }
  }

  /**
   * Set the trajectories.
   * @param {Object[][]} trajectories An array of length 2, representing the
   *  trajectories for player 1 and 2.
   * @param {Object[]} trajectories[].trajectory
   * @param {number} trajectories[].trajectory[].x The column index.
   * @param {number} trajectories[].trajectory[].y The row index.
   * @param {number} trajectories[].trajectory[].orientation The orientation.
   */
  setTrajectories(trajectories) {
    this.trajectories = trajectories;
    this.trajectoryIndex = 0;
    this.trajectorySize = trajectories[0].length;
    this._drawTrajectories();
  }

  /**
   * Remove all trajectories from the grid.
   */
  _clearTrajectories() {
    this.elem.selectAll('.intention').remove();

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (!this._isCornerCell(i, j)) {
          this.grid[i][j].hexagon.attr('fill', 'none');
        }
      }
    }
  }

  /**
   * Add a trajectory.
   * @param {Object[]} trajectory The trajectory to add.
   * @param {number} trajectory[].x The column index.
   * @param {number} trajectory[].y The row index.
   * @param {string} color Default color for the hexagons.
   * @param {string} startColor Color for the starting hexagon.
   * @param {string} stopColor Color for the final hexagon.
   * @param {string} intentionColor Color for the intention arrows.
   */
  _drawTrajectory(trajectory, color, startColor, stopColor, intentionColor) {
    let i = 0;

    // The last item in the trajectory list could be invalid (indicating the
    // player has crashed). Therefore, fill hexagons up untill this last item.
    while (i <= this.trajectoryIndex && i < this.trajectorySize - 1) {
      const cell = trajectory[i];

      const hexagon = this.grid[cell.y][cell.x];
      let fillColor = color;
      if (i == 0) {
        fillColor = startColor;
      } else if (i == this.trajectorySize - 2) {
        fillColor = stopColor;
      }

      hexagon.hexagon.attr('fill', fillColor);

      const rotation = -120 + 60 * trajectory[i + 1].orientation;

      this.elem.append('text')
        .attr('class', 'intention')
        .attr('font-family', 'FontAwesome')
        .attr('font-size', `${this.textSize}px`)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('transform',
          `translate(${hexagon.x}, ${hexagon.y}), rotate(${rotation})`)
        .attr('fill', intentionColor)
        .text('\uf061');
      i++;
    }
  }

  /**
   * Draw the trajectories for both players.
   */
  _drawTrajectories() {
    this._clearTrajectories();
    this._drawTrajectory(this.trajectories[0],
      '#8dd4e0', '#5aa1ad', '#daffff', '#276e7a');
    this._drawTrajectory(this.trajectories[1],
      '#f8c633', '#c59200', '#ffec59', '#926000');
  }

  /**
   * Increase the timestep.
   */
  trajectoryForward() {
    if (this.trajectoryIndex < this.trajectorySize - 2) {
      this.trajectoryIndex++;
      this._drawTrajectories();
    }
  }

  /**
   * Decrease the timestep.
   */
  trajectoryBackward() {
    if (this.trajectoryIndex > 0) {
      this.trajectoryIndex--;
      this._drawTrajectories();
    }
  }

  /**
   * Reset the timestep.
   */
  trajectoryBegin() {
    this.trajectoryIndex = 0;
    this._drawTrajectories();
  }

  /**
   * Go to the final timestep.
   */
  trajectoryEnd() {
    this.trajectoryIndex = this.trajectorySize - 1;
    this._drawTrajectories();
  }
}
