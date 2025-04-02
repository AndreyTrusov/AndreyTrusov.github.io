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
        this.isStart = false;
        this.isTarget = false;
        this.isCurrentNode = false;
        this.parent = null;
        this.visitedCount = 0;
    }

    connect(node, weight = null) {
        if (!this.connections.includes(node)) {
            this.connections.push(node);
            node.connections.push(this);
        }
    }

    reset() {
        this.visited = false;
        this.isCurrentNode = false;
        this.parent = null;
        this.visitedCount = 0;
    }
}

class RandomWalkGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.path = [];
        this.currentNode = null;
        this.startNode = null;
        this.targetNode = null;
        this.pathFound = false;
        this.algorithmRunning = false;
        this.maxSteps = 100; // Prevent infinite loops
        this.stepCount = 0;
        this.isRestarting = false;

        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.infoPanel = document.getElementById('infoItems');

        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.toggleTargetNode = this.toggleTargetNode.bind(this);

        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);

        document.querySelector('h1').textContent = "Random Walk Algorithm Visualization";
        const description = document.querySelector('.algorithm-description');
        description.innerHTML = `
            <h3>How Random Walk Works:</h3>
            <p>The Random Walk algorithm explores a graph by randomly selecting a neighboring node at each step.
               Unlike deterministic algorithms like BFS or DFS, a random walk doesn't follow a specific strategy.</p>
            <p>Key characteristics:</p>
            <ul>
                <li>At each step, one of the current node's neighbors is selected at random</li>
                <li>The walk continues until it finds the target or reaches a maximum number of steps</li>
                <li>Random walks can visit the same node multiple times</li>
                <li>If the walk gets stuck or exceeds the maximum steps, it can restart from the beginning</li>
            </ul>
            <p>In this visualization, you can:</p>
            <ul>
                <li>Generate a new random graph</li>
                <li>Select a target node by clicking on it</li>
                <li>Step through the random walk manually with the "Next Step" button</li>
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
        this.startNode.isStart = true;
        this.currentNode = null;
        this.targetNode = null;

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
            node.y = height * 0.25;
        });

        const level2Nodes = this.nodes.filter(node => node.level === 2);
        const nodesByParent1 = {};

        level2Nodes.forEach(node => {
            const parent = this.edges.find(edge =>
                (edge.node1 === node && edge.node2.level === 1) ||
                (edge.node2 === node && edge.node1.level === 1)
            );
            const parentNode = parent.node1.level === 1 ? parent.node1 : parent.node2;
            if (!nodesByParent1[parentNode.id]) {
                nodesByParent1[parentNode.id] = [];
            }
            nodesByParent1[parentNode.id].push(node);
        });

        for (const parentId in nodesByParent1) {
            const parent = this.nodes.find(node => node.id === parseInt(parentId));
            const children = nodesByParent1[parentId];
            const parentWidth = width / level1Nodes.length;
            const step = parentWidth / (children.length + 1);

            children.forEach((node, index) => {
                const offset = (index + 1) * step - parentWidth / 2;
                node.x = parent.x + offset;
                node.y = height * 0.5;
            });
        }
    }

    toggleTargetNode(node) {
        if (!this.algorithmRunning && node !== this.startNode) {
            if (this.targetNode === node) {
                node.isTarget = false;
                this.targetNode = null;
            } else {
                if (this.targetNode) {
                    this.targetNode.isTarget = false;
                }
                node.isTarget = true;
                this.targetNode = node;
            }

            this.updateUI();
            document.getElementById('target-node').textContent = `Target Node: ${this.targetNode ? this.targetNode.id : 'None'}`;
            this.nextStepButton.disabled = !this.targetNode;
        }
    }

    nextStep() {
        if (this.pathFound) {
            return;
        }

        if (!this.algorithmRunning) {
            if (this.startNode && this.targetNode) {
                this.algorithmRunning = true;

                this.currentNode = this.startNode;
                this.currentNode.isCurrentNode = true;
                this.currentNode.visited = true;
                this.currentNode.visitedCount++;
                this.path = [this.currentNode];
                this.stepCount = 0;

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (!this.targetNode) {
                this.showMessage("Please select a target node");
                return;
            }
        }

        if (this.isRestarting) {
            this.showMessage("Restarting random walk from start node");
            this.isRestarting = false;

            if (this.currentNode) {
                this.currentNode.isCurrentNode = false;
            }

            this.currentNode = this.startNode;
            this.currentNode.isCurrentNode = true;
            this.currentNode.visitedCount++;
            this.path.push(this.currentNode);
            this.stepCount = 0;
            this.updateUI();
            return;
        }

        this.stepCount++;

        if (this.currentNode === this.targetNode) {
            this.pathFound = true;
            this.showMessage(`Path found after ${this.stepCount} steps!`);
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            this.updateUI();
            return;
        }

        if (this.stepCount >= this.maxSteps) {
            this.showMessage(`Maximum steps (${this.maxSteps}) reached. Restarting...`);
            this.isRestarting = true;
            this.updateUI();
            return;
        }

        this.takeRandomStep();
        this.updateUI();
    }

    takeRandomStep() {
        const currentConnections = this.currentNode.connections;

        if (currentConnections.length === 0) {
            this.showMessage("Reached a dead end. Restarting...");
            this.isRestarting = true;
            return;
        }

        const randomIndex = Math.floor(Math.random() * currentConnections.length);
        const nextNode = currentConnections[randomIndex];

        this.currentNode.isCurrentNode = false;
        nextNode.isCurrentNode = true;
        nextNode.visited = true;
        nextNode.visitedCount++;
        nextNode.parent = this.currentNode;

        this.currentNode = nextNode;
        this.path.push(this.currentNode);
    }

    reset(fullReset = true) {
        if (this.nodes.length === 0) return;

        this.nodes.forEach(node => {
            node.reset();
            if (!fullReset) {
                if (node === this.startNode) node.isStart = true;
                if (node === this.targetNode) node.isTarget = true;
            }
        });

        this.path = [];
        this.pathFound = false;
        this.algorithmRunning = false;
        this.stepCount = 0;
        this.isRestarting = false;

        if (fullReset) {
            if (this.startNode) this.startNode.isStart = false;
            if (this.targetNode) this.targetNode.isTarget = false;
            this.targetNode = null;
        }

        if (this.nodes.length > 0) {
            this.startNode = this.nodes[0];
            this.startNode.isStart = true;
        }

        this.hideMessage();
        this.updateButtons(true, false);
        this.updateUI();
    }

    updateButtons(canGenerate, isRunning) {
        this.generateButton.disabled = isRunning;
        this.nextStepButton.disabled = !this.targetNode || this.pathFound;
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

            const isPathEdge = this.isEdgeInPath(node1, node2);

            if (isPathEdge.inPath) {
                edgeEl.classList.add('path-edge');

                if (isPathEdge.count > 1) {
                    edgeEl.style.height = `${Math.min(2 + isPathEdge.count, 8)}px`;
                    edgeEl.style.opacity = Math.min(0.4 + isPathEdge.count * 0.1, 1);
                }
            } else if (node1.visited && node2.visited) {
                edgeEl.classList.add('visited-edge');
            }

            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            edgeEl.style.width = `${length}px`;
            edgeEl.style.left = `${node1.x}px`;
            edgeEl.style.top = `${node1.y}px`;
            edgeEl.style.transform = `rotate(${angle}deg)`;

            container.appendChild(edgeEl);
        });
    }

    isEdgeInPath(node1, node2) {
        let count = 0;
        let inPath = false;

        for (let i = 0; i < this.path.length - 1; i++) {
            const a = this.path[i];
            const b = this.path[i + 1];

            if ((a === node1 && b === node2) || (a === node2 && b === node1)) {
                inPath = true;
                count++;
            }
        }

        return {inPath, count};
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

            if (node.visitedCount > 0) {
                const visitCountLabel = document.createElement('div');
                visitCountLabel.className = 'visit-count';
                visitCountLabel.textContent = node.visitedCount;
                visitCountLabel.style.position = 'absolute';
                visitCountLabel.style.top = '-25px';
                visitCountLabel.style.left = '50%';
                visitCountLabel.style.transform = 'translateX(-50%)';
                visitCountLabel.style.textAlign = 'center';
                visitCountLabel.style.fontSize = '12px';
                visitCountLabel.style.fontWeight = 'bold';
                visitCountLabel.style.color = '#333';
                visitCountLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                visitCountLabel.style.borderRadius = '10px';
                visitCountLabel.style.padding = '2px 5px';
                nodeEl.appendChild(visitCountLabel);
            }

            if (node.isCurrentNode) {
                nodeEl.classList.add('current-node');
            }

            if (node.isTarget) {
                nodeEl.classList.add('target-node');
            }

            if (node.isStart) {
                nodeEl.classList.add('start-node');
            }

            if (node.visited) {
                nodeEl.classList.add('visited');
                if (node.visitedCount > 1) {
                    nodeEl.style.opacity = Math.min(0.5 + node.visitedCount * 0.1, 1);
                }
            }

            nodeEl.addEventListener('click', () => {
                if (!this.algorithmRunning && node !== this.startNode) {
                    this.toggleTargetNode(node);
                }
            });

            container.appendChild(nodeEl);
        });

        document.getElementById('current-node').textContent = `Current Node: ${this.currentNode ? this.currentNode.id : 'None'}`;
        document.getElementById('target-node').textContent = `Target Node: ${this.targetNode ? this.targetNode.id : 'None (Click on a node to set as target)'}`;
        document.getElementById('steps-count').textContent = `Steps: ${this.stepCount}`;
        document.getElementById('path-length').textContent = `Path Length: ${this.path.length}`;

        this.updatePathDisplay();
    }

    updatePathDisplay() {
        this.infoPanel.innerHTML = '';

        if (this.path.length === 0) {
            return;
        }

        const pathHeader = document.createElement('div');
        pathHeader.className = 'info-header';
        pathHeader.textContent = 'Random Walk Path:';
        pathHeader.style.fontWeight = 'bold';
        pathHeader.style.marginBottom = '5px';
        this.infoPanel.appendChild(pathHeader);

        const pathDisplay = document.createElement('div');
        pathDisplay.className = 'path-display';
        pathDisplay.style.maxHeight = '100px';
        pathDisplay.style.overflowY = 'auto';
        pathDisplay.style.border = '1px solid #ccc';
        pathDisplay.style.padding = '5px';
        pathDisplay.style.borderRadius = '5px';
        pathDisplay.style.backgroundColor = '#f8f9fa';

        const pathText = this.path.map(node => node.id).join(' → ');
        pathDisplay.textContent = pathText;

        this.infoPanel.appendChild(pathDisplay);
    }
}

const graph = new RandomWalkGraph();

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

document.getElementById('randomWalkButton').classList.add('active');