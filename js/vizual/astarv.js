class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.weight = Math.floor(Math.random() * 91) + 10; // Random weight between 10-100
    }
}

class Node {
    constructor(id, level) {
        this.id = id;
        this.level = level;
        this.connections = [];
        this.x = 0;
        this.y = 0;
        this.visited = false;
        this.inQueue = false;
        this.parent = null;
        this.gScore = Infinity;
        this.fScore = Infinity;
    }

    connect(node, weight = null) {
        if (!this.connections.includes(node)) {
            this.connections.push(node);
            node.connections.push(this);
        }
    }

    reset() {
        this.visited = false;
        this.inQueue = false;
        this.parent = null;
        this.gScore = Infinity;
        this.fScore = Infinity;
    }
}

class AStarGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.openSet = []; // Priority queue based on fScore
        this.visitedNodes = [];
        this.currentNode = null;
        this.startNode = null;
        this.endNodes = [];
        this.pathFound = false;
        this.solutionPaths = [];
        this.algorithmRunning = false;

        // UI Elements
        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.queueContainer = document.getElementById('queueItems');

        // Bind methods
        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.toggleEndNode = this.toggleEndNode.bind(this);

        // Set up event listeners
        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);

        // Update title and description
        document.querySelector('h1').textContent = "A* Search Algorithm Visualization";
        const description = document.querySelector('.algorithm-description');
        description.innerHTML = `
            <h3>How A* Search Algorithm Works:</h3>
            <p>A* (A-star) is an informed search algorithm that uses both the actual cost to reach a node (g-score) 
               and a heuristic estimate to the goal (h-score) to determine which nodes to explore next.</p>
            <p>f(n) = g(n) + h(n) where:</p>
            <ul>
                <li>g(n) is the cost from the start node to the current node</li>
                <li>h(n) is the estimated cost from the current node to the goal</li>
            </ul>
            <p>In this visualization, you can:</p>
            <ul>
                <li>Generate a new random weighted graph</li>
                <li>Select one or more target nodes by clicking on them</li>
                <li>Step through the A* algorithm manually with the "Next Step" button</li>
                <li>Reset the visualization at any time</li>
            </ul>
        `;
    }

    generate() {
        this.reset();
        this.nodes = [];
        this.edges = [];
        this.pathFound = false;

        const root = new Node(1, 0);
        this.nodes.push(root);

        const level1Count = Math.floor(Math.random() * 2) + 3; // 3-4 nodes
        for (let i = 0; i < level1Count; i++) {
            const node = new Node(this.nodes.length + 1, 1);
            this.nodes.push(node);
            root.connect(node);
            this.edges.push(new Edge(root, node));
        }

        const level1Nodes = this.nodes.filter(node => node.level === 1);
        level1Nodes.forEach(parentNode => {
            const childCount = Math.floor(Math.random() * 2) + 2; // 2-3 children
            for (let i = 0; i < childCount; i++) {
                const node = new Node(this.nodes.length + 1, 2);
                this.nodes.push(node);
                parentNode.connect(node);
                this.edges.push(new Edge(parentNode, node));
            }
        });

        this.positionNodes();

        this.startNode = root;
        this.currentNode = null;
        this.endNodes = [];

        this.updateButtons(true, false);
        this.updateUI();
    }

    positionNodes() {
        const container = document.getElementById('visualization');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Position root node
        const root = this.nodes[0];
        root.x = width / 2;
        root.y = 50;

        // Position level 1 nodes
        const level1Nodes = this.nodes.filter(node => node.level === 1);
        const l1Width = width * 0.8;
        const l1Step = l1Width / (level1Nodes.length + 1);

        level1Nodes.forEach((node, index) => {
            node.x = (width * 0.1) + (index + 1) * l1Step;
            node.y = height / 2 - 50;
        });

        // Position level 2 nodes
        const level2Nodes = this.nodes.filter(node => node.level === 2);
        const nodesByParent = {};

        level2Nodes.forEach(node => {
            const parent = this.edges.find(edge =>
                (edge.node1 === node && edge.node2.level === 1) ||
                (edge.node2 === node && edge.node1.level === 1)
            );
            const parentNode = parent.node1.level === 1 ? parent.node1 : parent.node2;
            if (!nodesByParent[parentNode.id]) {
                nodesByParent[parentNode.id] = [];
            }
            nodesByParent[parentNode.id].push(node);
        });

        for (const parentId in nodesByParent) {
            const parent = this.nodes.find(node => node.id === parseInt(parentId));
            const children = nodesByParent[parentId];
            const parentWidth = width / level1Nodes.length;
            const step = parentWidth / (children.length + 1);

            children.forEach((node, index) => {
                const offset = (index + 1) * step - parentWidth / 2;
                node.x = parent.x + offset;
                node.y = height - 80;
            });
        }
    }

    // Calculate heuristic
    heuristic(node, targetNode) {
        const dx = node.x - targetNode.x;
        const dy = node.y - targetNode.y;
        return Math.sqrt(dx * dx + dy * dy) / 15; // Scale down to match edge weights better
    }

    // Calculate the best heuristic to any target
    getBestHeuristic(node) {
        if (this.endNodes.length === 0) return 0;

        // Calculate heuristic to all targets and use the minimum
        return Math.min(...this.endNodes.map(target => this.heuristic(node, target)));
    }

    toggleEndNode(node) {
        if (!this.algorithmRunning && node !== this.startNode) {
            const index = this.endNodes.indexOf(node);
            if (index === -1) {
                if (this.endNodes.length < 2) {
                    this.endNodes.push(node);
                } else {
                    this.endNodes.shift();
                    this.endNodes.push(node);
                }
            } else {
                this.endNodes.splice(index, 1);
            }
            this.updateUI();
            document.getElementById('end-node').textContent = `Target Node(s): ${this.endNodes.map(n => n.id).join(', ') || 'None'}`;
            this.nextStepButton.disabled = this.endNodes.length === 0;
        }
    }

    nextStep() {
        if (this.pathFound) {
            return;
        }

        // First step - initialize A*
        if (!this.algorithmRunning) {
            if (this.startNode && this.endNodes.length > 0) {
                this.algorithmRunning = true;

                this.startNode.gScore = 0;
                this.startNode.fScore = this.getBestHeuristic(this.startNode);

                this.addToOpenSet(this.startNode);

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (this.endNodes.length === 0) {
                this.showMessage("Please select at least one target node");
                return;
            }
        }

        if (this.openSet.length === 0) {
            this.showMessage("No path found to target node(s)!");
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            return;
        }

        // Get node with lowest fScore from open set
        const currentNodeId = this.openSet.shift();
        this.currentNode = this.nodes.find(node => node.id === currentNodeId);
        this.currentNode.inQueue = false;

        // Mark as visited
        if (!this.currentNode.visited) {
            this.currentNode.visited = true;
            this.visitedNodes.push(this.currentNode);
        }

        // Check if we reached an end node
        if (this.endNodes.includes(this.currentNode)) {
            this.reconstructPath(this.currentNode);

            const allTargetsFound = this.endNodes.every(target =>
                this.solutionPaths.some(path => path[path.length - 1] === target)
            );

            if (allTargetsFound) {
                this.pathFound = true;
                this.showMessage("All paths found!");
                this.algorithmRunning = false;
                this.updateButtons(true, false);
            } else {
                this.showMessage(`Path to node ${this.currentNode.id} found!`);
            }

            this.updateUI();
            return;
        }

        this.exploreNeighbors(this.currentNode);
        this.updateUI();
    }

    exploreNeighbors(node) {
        const connectedEdges = this.edges.filter(edge =>
            edge.node1 === node || edge.node2 === node
        );

        connectedEdges.forEach(edge => {
            const neighbor = edge.node1 === node ? edge.node2 : edge.node1;

            const tentativeGScore = node.gScore + edge.weight;

            if (tentativeGScore < neighbor.gScore) {
                neighbor.parent = node;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = tentativeGScore + this.getBestHeuristic(neighbor);

                if (!neighbor.inQueue && !neighbor.visited) {
                    this.addToOpenSet(neighbor);
                }
            }
        });
    }

    addToOpenSet(node) {
        node.inQueue = true;

        let insertIndex = this.openSet.findIndex(nodeId => {
            const otherNode = this.nodes.find(n => n.id === nodeId);
            return otherNode.fScore > node.fScore;
        });

        if (insertIndex === -1) {
            insertIndex = this.openSet.length;
        }

        this.openSet.splice(insertIndex, 0, node.id);
    }

    reconstructPath(endNode) {
        if (!endNode) return;

        const path = [];
        let current = endNode;

        while (current) {
            path.unshift(current);
            current = current.parent;
        }

        this.solutionPaths.push(path);
    }

    reset(fullReset = true) {
        if (this.nodes.length === 0) return;

        // Reset all nodes
        this.nodes.forEach(node => node.reset());

        this.openSet = [];
        this.visitedNodes = [];
        this.solutionPaths = [];
        this.pathFound = false;
        this.algorithmRunning = false;
        this.currentNode = null;

        if (fullReset) {
            this.endNodes = [];
        }

        this.hideMessage();
        this.updateButtons(true, false);
        this.updateUI();
    }

    updateButtons(canGenerate, isRunning) {
        this.generateButton.disabled = isRunning;
        this.nextStepButton.disabled = this.endNodes.length === 0 || this.pathFound;
    }

    showMessage(message) {
        this.messageBox.textContent = message;
        this.messageBox.style.display = 'block';

        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    }

    hideMessage() {
        this.messageBox.style.display = 'none';
    }

    drawEdges() {
        const container = document.getElementById('visualization');

        this.edges.forEach(edge => {
            const node1 = edge.node1;
            const node2 = edge.node2;

            const edgeEl = document.createElement('div');
            edgeEl.className = 'edge';

            const isPathEdge = this.isEdgeInSolutionPath(node1, node2);
            if (isPathEdge) {
                edgeEl.classList.add('solution-path');
            } else if (node1.visited && node2.visited) {
                edgeEl.classList.add('traversed');
            }

            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            edgeEl.style.width = `${length}px`;
            edgeEl.style.left = `${node1.x}px`;
            edgeEl.style.top = `${node1.y}px`;
            edgeEl.style.transform = `rotate(${angle}deg)`;

            // Add distance label
            const distanceLabel = document.createElement('div');
            distanceLabel.className = 'distance-label';
            distanceLabel.textContent = edge.weight;
            distanceLabel.style.position = 'absolute';
            distanceLabel.style.top = '-20px';
            distanceLabel.style.left = `${length / 2 - 10}px`;
            distanceLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            distanceLabel.style.padding = '2px 5px';
            distanceLabel.style.borderRadius = '10px';
            distanceLabel.style.fontSize = '12px';
            distanceLabel.style.fontWeight = 'bold';
            distanceLabel.style.zIndex = '5';
            edgeEl.appendChild(distanceLabel);

            if (edgeEl.classList.contains('traversed') || edgeEl.classList.contains('solution-path')) {
                const arrow = document.createElement('div');
                arrow.className = 'edge-arrow';
                if (isPathEdge) {
                    arrow.style.borderLeftColor = '#2ecc71';
                }
                arrow.style.left = `${length - 10}px`;
                arrow.style.top = '-6px';
                edgeEl.appendChild(arrow);
            }

            container.appendChild(edgeEl);
        });
    }

    isEdgeInSolutionPath(node1, node2) {
        for (const path of this.solutionPaths) {
            if (path.length < 2) continue;

            for (let i = 0; i < path.length - 1; i++) {
                const a = path[i];
                const b = path[i + 1];

                if ((a === node1 && b === node2) || (a === node2 && b === node1)) {
                    return true;
                }
            }
        }
        return false;
    }

    updateUI() {
        const container = document.getElementById('visualization');
        container.innerHTML = '';
        this.messageBox = document.createElement('div');
        this.messageBox.id = 'messageBox';
        this.messageBox.className = 'message-box';
        container.appendChild(this.messageBox);

        this.drawEdges();

        this.nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `node level-${node.level}`;
            nodeEl.textContent = node.id;
            nodeEl.style.left = `${node.x - 25}px`;
            nodeEl.style.top = `${node.y - 25}px`;

            // Add scores labels for visited nodes
            if ((node.inQueue || node.visited) && node !== this.startNode) {
                const scoresLabel = document.createElement('div');
                scoresLabel.className = 'node-scores';
                scoresLabel.innerHTML = `g:${node.gScore.toFixed(0)} f:${node.fScore.toFixed(0)}`;
                scoresLabel.style.position = 'absolute';
                scoresLabel.style.top = '-25px';
                scoresLabel.style.left = '0';
                scoresLabel.style.width = '100%';
                scoresLabel.style.textAlign = 'center';
                scoresLabel.style.fontSize = '11px';
                scoresLabel.style.fontWeight = 'bold';
                scoresLabel.style.color = '#333';
                scoresLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                scoresLabel.style.borderRadius = '10px';
                scoresLabel.style.padding = '2px 0';
                nodeEl.appendChild(scoresLabel);
            }

            if (node === this.currentNode) {
                nodeEl.classList.add('current');
            }

            if (this.endNodes.includes(node)) {
                nodeEl.classList.add('end-node');
            }

            if (node.visited) {
                nodeEl.classList.add('visited');
            }

            if (node.inQueue) {
                nodeEl.classList.add('in-queue');
            }

            nodeEl.addEventListener('click', () => {
                if (!this.algorithmRunning && node !== this.startNode) {
                    this.toggleEndNode(node);
                }
            });

            container.appendChild(nodeEl);
        });

        // Update info panel
        document.getElementById('current-node').textContent = `Current Node: ${this.currentNode ? this.currentNode.id : this.startNode ? this.startNode.id : 'None'}`;
        document.getElementById('end-node').textContent = `Target Node(s): ${this.endNodes.map(node => node.id).join(', ') || 'None (Click on nodes to set targets)'}`;
        document.getElementById('visited-nodes').textContent = `Visited Nodes: ${this.visitedNodes.map(node => node.id).join(', ') || 'None'}`;

        this.updateOpenSetDisplay();
    }

    updateOpenSetDisplay() {
        this.queueContainer.innerHTML = '';
        document.querySelector('.queue-label').textContent = "Open Set (by f-score):";

        if (this.openSet.length === 0) {
            return;
        }

        this.openSet.forEach(nodeId => {
            const node = this.nodes.find(n => n.id === nodeId);
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `${nodeId}<span style="font-size: 9px; display: block;">f=${node.fScore.toFixed(0)}</span>`;
            this.queueContainer.appendChild(queueItem);
        });
    }
}

const graph = new AStarGraph();

window.addEventListener('load', () => {
    graph.generate();
});

document.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
        graph.nextStep();
    } else if (event.key === 'r') {
        graph.reset();
    } else if (event.key === 'g') {
        graph.generate();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const algorithmButtons = document.querySelectorAll('.algorithm-selector .btn');

    algorithmButtons.forEach(button => {
        button.addEventListener('click', function () {
            algorithmButtons.forEach(btn => btn.classList.remove('active'));

            this.classList.add('active');

            const algorithm = this.id;
            console.log(`Switched to ${algorithm}`);

            if (algorithm === 'mapButton') {
                window.location.href = 'index_old.html';
            } else if (algorithm === 'bfsButton') {
                window.location.href = 'index.html';
            } else if (algorithm === 'dijkstraButton') {
                window.location.href = 'index_3.html';
            } else if (algorithm === 'dfsButton') {
                window.location.href = 'index_4.html';
            } else if (algorithm === 'astarButton') {
                window.location.href = 'index_5.html';
            } else if (algorithm === 'bidirectionalButton') {
                window.location.href = 'index_6.html';
            } else if (algorithm === 'randomWalkButton') {
                window.location.href = 'index_7.html';
            } else if (algorithm === 'bestFirstButton') {
                window.location.href = 'index_8.html';
            }
        });
    });
});

document.getElementById('astarButton').classList.add('active');