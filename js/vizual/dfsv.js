class Edge {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.weight = Math.floor(Math.random() * 91) + 10;
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
        this.inStack = false;
        this.parent = null;
    }

    connect(node, weight = null) {
        if (!this.connections.includes(node)) {
            this.connections.push(node);
            node.connections.push(this);
        }
    }

    reset() {
        this.visited = false;
        this.inStack = false;
        this.parent = null;
    }
}

class DFSGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.stack = [];
        this.visitedNodes = [];
        this.currentNode = null;
        this.startNode = null;
        this.endNodes = [];
        this.pathFound = false;
        this.solutionPaths = [];
        this.algorithmRunning = false;

        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.stackContainer = document.getElementById('queueItems');

        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.toggleEndNode = this.toggleEndNode.bind(this);

        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);

        document.querySelector('h1').textContent = "Depth-First Search Visualization";
        const description = document.querySelector('.algorithm-description');
        description.innerHTML = `
            <h3>How Depth-First Search (DFS) Works:</h3>
            <p>DFS explores as far as possible along each branch before backtracking. 
               It uses a stack data structure to keep track of nodes to visit next.</p>
            <p>In this visualization, you can:</p>
            <ul>
                <li>Generate a new random graph</li>
                <li>Select one or more target nodes by clicking on them</li>
                <li>Step through the DFS algorithm manually with the "Next Step" button</li>
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

        const level1Count = Math.floor(Math.random() * 2) + 3;
        for (let i = 0; i < level1Count; i++) {
            const node = new Node(this.nodes.length + 1, 1);
            this.nodes.push(node);
            root.connect(node);
            this.edges.push(new Edge(root, node));
        }

        const level1Nodes = this.nodes.filter(node => node.level === 1);
        level1Nodes.forEach(parentNode => {
            const childCount = Math.floor(Math.random() * 2) + 2;
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

        const root = this.nodes[0];
        root.x = width / 2;
        root.y = 50;

        const level1Nodes = this.nodes.filter(node => node.level === 1);
        const l1Width = width * 0.8;
        const l1Step = l1Width / (level1Nodes.length + 1);

        level1Nodes.forEach((node, index) => {
            node.x = (width * 0.1) + (index + 1) * l1Step;
            node.y = height / 2 - 50;
        });

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

        if (!this.algorithmRunning) {
            if (this.startNode && this.endNodes.length > 0) {
                this.algorithmRunning = true;

                this.pushToStack(this.startNode);

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (this.endNodes.length === 0) {
                this.showMessage("Please select at least one target node");
                return;
            }
        }

        if (this.stack.length === 0) {
            this.showMessage("No path found to target node(s)!");
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            return;
        }

        const currentNodeId = this.stack.pop();
        this.currentNode = this.nodes.find(node => node.id === currentNodeId);
        this.currentNode.inStack = false;

        if (this.currentNode.visited) {
            this.updateUI();
            return;
        }

        this.currentNode.visited = true;
        this.visitedNodes.push(this.currentNode);

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

        this.addNeighborsToStack(this.currentNode);
        this.updateUI();
    }

    addNeighborsToStack(node) {
        const neighbors = [];

        const connectedEdges = this.edges.filter(edge =>
            edge.node1 === node || edge.node2 === node
        );

        connectedEdges.forEach(edge => {
            const neighbor = edge.node1 === node ? edge.node2 : edge.node1;
            if (!neighbor.visited) {
                neighbors.push(neighbor);
                neighbor.parent = node;
            }
        });

        for (let i = neighbors.length - 1; i >= 0; i--) {
            this.pushToStack(neighbors[i]);
        }
    }

    pushToStack(node) {
        node.inStack = true;
        this.stack.push(node.id);
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

        this.nodes.forEach(node => node.reset());

        this.stack = [];
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

            if (node === this.currentNode) {
                nodeEl.classList.add('current');
            }

            if (this.endNodes.includes(node)) {
                nodeEl.classList.add('end-node');
            }

            if (node.visited) {
                nodeEl.classList.add('visited');
            }

            if (node.inStack) {
                nodeEl.classList.add('in-queue');
            }


            nodeEl.addEventListener('click', () => {
                if (!this.algorithmRunning && node !== this.startNode) {
                    this.toggleEndNode(node);
                }
            });

            container.appendChild(nodeEl);
        });

        document.getElementById('current-node').textContent = `Current Node: ${this.currentNode ? this.currentNode.id : this.startNode ? this.startNode.id : 'None'}`;
        document.getElementById('end-node').textContent = `Target Node(s): ${this.endNodes.map(node => node.id).join(', ') || 'None (Click on nodes to set targets)'}`;
        document.getElementById('visited-nodes').textContent = `Visited Nodes: ${this.visitedNodes.map(node => node.id).join(', ') || 'None'}`;

        this.updateStackDisplay();
    }

    updateStackDisplay() {
        this.stackContainer.innerHTML = '';
        document.querySelector('.queue-label').textContent = "DFS Stack:";

        if (this.stack.length === 0) {
            return;
        }

        for (let i = this.stack.length - 1; i >= 0; i--) {
            const nodeId = this.stack[i];
            const stackItem = document.createElement('div');
            stackItem.className = 'queue-item';
            stackItem.innerHTML = `${nodeId}`;

            if (i === this.stack.length - 1) {
                stackItem.style.borderColor = '#e74c3c';
                stackItem.style.backgroundColor = '#f9e7e7';
            }

            this.stackContainer.appendChild(stackItem);
        }
    }
}

const graph = new DFSGraph();

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

document.getElementById('dfsButton').classList.add('active');