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
    }

    connect(node) {
        if (!this.connections.includes(node)) {
            this.connections.push(node);
            node.connections.push(this);
        }
    }

    reset() {
        this.visited = false;
        this.inQueue = false;
        this.parent = null;
    }
}

class BFSGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.queue = [];
        this.visitedNodes = [];
        this.currentNode = null;
        this.startNode = null;
        this.endNode = null;
        this.pathFound = false;
        this.solutionPath = [];
        this.bfsRunning = false;

        // UI Elements
        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.queueContainer = document.getElementById('queueItems');

        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.setEndNode = this.setEndNode.bind(this);

        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);
    }

    generate() {
        this.reset();
        this.nodes = [];
        this.edges = [];
        this.pathFound = false;

        // Create root node (level 0)
        const root = new Node(1, 0);
        this.nodes.push(root);

        // Create level 1 nodes (2-5)
        const level1Count = Math.floor(Math.random() * 2) + 3; // 3-4 nodes
        for (let i = 0; i < level1Count; i++) {
            const node = new Node(this.nodes.length + 1, 1);
            this.nodes.push(node);
            root.connect(node);
            this.edges.push([root, node]);
        }

        // Create level 2 nodes (6-15)
        const level1Nodes = this.nodes.filter(node => node.level === 1);
        level1Nodes.forEach(parentNode => {
            const childCount = Math.floor(Math.random() * 2) + 2; // 2-3 children
            for (let i = 0; i < childCount; i++) {
                const node = new Node(this.nodes.length + 1, 2);
                this.nodes.push(node);
                parentNode.connect(node);
                this.edges.push([parentNode, node]);
            }
        });

        this.positionNodes();

        this.startNode = root;
        this.currentNode = null;
        this.endNode = null;

        this.updateButtons(true, false);
        this.updateUI();
    }

    positionNodes() {
        const container = document.getElementById('visualization');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

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
            const parent = this.edges.find(edge => edge[1] === node)[0];
            if (!nodesByParent[parent.id]) {
                nodesByParent[parent.id] = [];
            }
            nodesByParent[parent.id].push(node);
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

    setEndNode(node) {
        if (!this.bfsRunning && node !== this.startNode) {
            this.endNode = node;
            this.updateUI();
            document.getElementById('end-node').textContent = `Target Node: ${this.endNode ? this.endNode.id : 'None'}`;
            this.nextStepButton.disabled = !this.endNode;
        }
    }

    nextStep() {
        if (this.pathFound) {
            return;
        }

        // First step - initialize BFS
        if (!this.bfsRunning) {
            if (this.startNode && this.endNode) {
                this.bfsRunning = true;

                this.currentNode = this.startNode;
                this.currentNode.visited = true;
                this.visitedNodes.push(this.currentNode);

                // Add neighbors to queue
                this.addNeighborsToQueue(this.currentNode);

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (!this.endNode) {
                this.showMessage("Please select a target node first by clicking on a node");
                return;
            }
        }

        if (this.queue.length === 0) {
            this.showMessage("No path found to target node!");
            this.bfsRunning = false;
            this.updateButtons(true, false);
            return;
        }

        // Get next node from queue
        this.currentNode = this.queue.shift();
        this.currentNode.inQueue = false;

        // Check if we reached the end node
        if (this.currentNode === this.endNode) {
            this.pathFound = true;
            this.reconstructPath();
            this.showMessage("Path found!");
            this.bfsRunning = false;
            this.updateButtons(true, false);
            this.updateUI();
            return;
        }

        // Mark as visited
        if (!this.currentNode.visited) {
            this.currentNode.visited = true;
            this.visitedNodes.push(this.currentNode);
        }

        // Add neighbors to queue
        this.addNeighborsToQueue(this.currentNode);

        this.updateUI();
    }

    addNeighborsToQueue(node) {
        node.connections.forEach(neighbor => {
            if (!neighbor.visited && !neighbor.inQueue) {
                neighbor.inQueue = true;
                neighbor.parent = node; // Remember where we came from
                this.queue.push(neighbor);
            }
        });
    }

    reconstructPath() {
        if (!this.endNode) return;

        this.solutionPath = [];
        let current = this.endNode;

        while (current) {
            this.solutionPath.unshift(current);
            current = current.parent;
        }
    }

    reset(fullReset = true) {
        if (this.nodes.length === 0) return;

        // Reset all nodes
        this.nodes.forEach(node => node.reset());

        this.queue = [];
        this.visitedNodes = [];
        this.solutionPath = [];
        this.pathFound = false;
        this.bfsRunning = false;
        this.currentNode = null;

        if (fullReset) {
            this.endNode = null;
        }

        this.hideMessage();
        this.updateButtons(true, false);
        this.updateUI();
    }

    updateButtons(canGenerate, isRunning) {
        this.generateButton.disabled = isRunning;
        this.nextStepButton.disabled = !this.endNode || this.pathFound;
    }

    showMessage(message) {
        this.messageBox.textContent = message;
        this.messageBox.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    }

    hideMessage() {
        this.messageBox.style.display = 'none';
    }

    drawEdges() {
        const container = document.getElementById('visualization');

        this.edges.forEach(([node1, node2]) => {
            const edge = document.createElement('div');
            edge.className = 'edge';

            // Check if edge is part of solution path
            const isPathEdge = this.isEdgeInSolutionPath(node1, node2);
            if (isPathEdge) {
                edge.classList.add('solution-path');
            }
            // Check if connected to visited nodes
            else if (node1.visited && node2.visited) {
                edge.classList.add('traversed');
            }

            // Calculate edge positioning
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            // Position and rotate the edge
            edge.style.width = `${length}px`;
            edge.style.left = `${node1.x}px`;
            edge.style.top = `${node1.y}px`;
            edge.style.transform = `rotate(${angle}deg)`;

            // Add arrow for direction on traversed paths
            if (edge.classList.contains('traversed') || edge.classList.contains('solution-path')) {
                const arrow = document.createElement('div');
                arrow.className = 'edge-arrow';
                if (isPathEdge) {
                    arrow.style.borderLeftColor = '#2ecc71';
                }
                arrow.style.left = `${length - 10}px`;
                arrow.style.top = '-6px';
                edge.appendChild(arrow);
            }

            container.appendChild(edge);
        });
    }

    isEdgeInSolutionPath(node1, node2) {
        if (this.solutionPath.length < 2) return false;

        for (let i = 0; i < this.solutionPath.length - 1; i++) {
            const a = this.solutionPath[i];
            const b = this.solutionPath[i + 1];

            if ((a === node1 && b === node2) || (a === node2 && b === node1)) {
                return true;
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

        // Draw nodes
        this.nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `node level-${node.level}`;
            nodeEl.textContent = node.id;
            nodeEl.style.left = `${node.x - 25}px`;
            nodeEl.style.top = `${node.y - 25}px`;

            if (node === this.currentNode) {
                nodeEl.classList.add('current');
            }

            if (node === this.endNode) {
                nodeEl.classList.add('end-node');
            }

            if (node.visited) {
                nodeEl.classList.add('visited');
            }

            if (node.inQueue) {
                nodeEl.classList.add('in-queue');
            }

            // Add click handler to set end node
            nodeEl.addEventListener('click', () => {
                if (!this.bfsRunning && node !== this.startNode) {
                    this.setEndNode(node);
                }
            });

            container.appendChild(nodeEl);
        });

        // Update info panel
        document.getElementById('current-node').textContent = `Current Node: ${this.currentNode ? this.currentNode.id : this.startNode ? this.startNode.id : 'None'}`;
        document.getElementById('end-node').textContent = `Target Node: ${this.endNode ? this.endNode.id : 'None (Click on a node to set as target)'}`;
        document.getElementById('visited-nodes').textContent = `Visited Nodes: ${this.visitedNodes.map(node => node.id).join(', ') || 'None'}`;

        this.updateQueueDisplay();
    }

    updateQueueDisplay() {
        this.queueContainer.innerHTML = '';

        if (this.queue.length === 0) {
            return;
        }

        this.queue.forEach(node => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.textContent = node.id;
            this.queueContainer.appendChild(queueItem);
        });
    }
}

// Initialize
const graph = new BFSGraph();

window.addEventListener('load', () => {
    graph.generate();
});

// Add keyboard controls
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

            // Navigate to the corresponding HTML file based on algorithm
            if (algorithm === 'mapButton') {
                window.location.href = 'index.html';
            } else if (algorithm === 'bfsButton') {
                window.location.href = 'index_2.html';
            } else if (algorithm === 'dijkstraButton') {
                window.location.href = 'index_3.html';
            }
        });
    });
});


document.getElementById('mapButton').classList.add('active');