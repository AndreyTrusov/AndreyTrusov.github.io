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
        this.heuristic = Infinity;
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
        this.heuristic = Infinity;
    }
}

class BestFirstSearch {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.priorityQueue = []; //[nodeId, heuristic]
        this.visitedNodes = [];
        this.currentNode = null;
        this.startNode = null;
        this.targetNode = null;
        this.pathFound = false;
        this.solutionPath = [];
        this.algorithmRunning = false;

        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.queueContainer = document.getElementById('queueItems');

        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.toggleTargetNode = this.toggleTargetNode.bind(this);

        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);

        document.querySelector('h1').textContent = "Best-First Search (Greedy) Algorithm Visualization";
        const description = document.querySelector('.algorithm-description');
        description.innerHTML = `
            <h3>How Best-First Search (Greedy) Works:</h3>
            <p>Best-First Search is an informed search algorithm that uses a heuristic function to prioritize which nodes to explore next.
               Unlike A*, it only considers the estimated distance to the goal (the heuristic) without accounting for the cost of the path so far.</p>
            <p>Key characteristics:</p>
            <ul>
                <li>Uses a <strong>priority queue</strong> based on a heuristic function</li>
                <li>Always explores the node that appears closest to the target</li>
                <li>Is "greedy" because it only looks at the estimated future cost</li>
                <li>May not find the optimal (shortest) path, but often finds a solution quickly</li>
            </ul>
            <p>In this visualization, we use Euclidean distance as the heuristic.</p>
            <p>In this visualization, you can:</p>
            <ul>
                <li>Generate a new random graph with 3 levels</li>
                <li>Select a target node by clicking on it</li>
                <li>Step through the algorithm manually with the "Next Step" button</li>
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

    calculateHeuristic(node) {
        if (!this.targetNode) return Infinity;

        // Base heuristic: Euclidean distance
        const dx = node.x - this.targetNode.x;
        const dy = node.y - this.targetNode.y;
        const baseHeuristic = Math.sqrt(dx * dx + dy * dy);

        // Add randomization factor (±30%)
        const randomFactor = 0.7 + (Math.random() * 0.6);

        // Make the heuristic more interesting by level
        let levelFactor = 1;
        if (node.level === 0) levelFactor = 0.9;
        else if (node.level === 1) levelFactor = 1.0;
        else if (node.level === 2) levelFactor = 1.1; // Slightly penalize deeper nodes

        return baseHeuristic * randomFactor * levelFactor;
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

            this.updateAllHeuristics();

            this.updateUI();
            document.getElementById('target-node').textContent = `Target Node: ${this.targetNode ? this.targetNode.id : 'None'}`;
            this.nextStepButton.disabled = !this.targetNode;
        }
    }

    updateAllHeuristics() {
        this.nodes.forEach(node => {
            node.heuristic = this.calculateHeuristic(node);
        });
    }

    nextStep() {
        if (this.pathFound) {
            return;
        }

        if (!this.algorithmRunning) {
            if (this.startNode && this.targetNode) {
                this.algorithmRunning = true;

                this.updateAllHeuristics();

                this.addToPriorityQueue(this.startNode);

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (!this.targetNode) {
                this.showMessage("Please select a target node");
                return;
            }
        }

        if (this.priorityQueue.length === 0) {
            this.showMessage("No path found to target node!");
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            return;
        }

        const [currentNodeId, _] = this.priorityQueue.shift();
        this.currentNode = this.nodes.find(node => node.id === currentNodeId);
        this.currentNode.inQueue = false;

        if (this.currentNode.visited) {
            this.updateUI();
            return;
        }

        this.currentNode.visited = true;
        this.visitedNodes.push(this.currentNode);

        if (this.currentNode === this.targetNode) {
            this.pathFound = true;
            this.reconstructPath();
            this.showMessage("Path found!");
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            this.updateUI();
            return;
        }

        this.addNeighborsToPriorityQueue();
        this.updateUI();
    }

    addNeighborsToPriorityQueue() {
        const connectedEdges = this.edges.filter(edge =>
            edge.node1 === this.currentNode || edge.node2 === this.currentNode
        );

        connectedEdges.forEach(edge => {
            const neighbor = edge.node1 === this.currentNode ? edge.node2 : edge.node1;

            if (!neighbor.visited && !neighbor.inQueue) {
                neighbor.parent = this.currentNode;
                this.addToPriorityQueue(neighbor);
            }
        });
    }

    addToPriorityQueue(node) {
        node.inQueue = true;

        const entry = [node.id, node.heuristic];

        let insertIndex = this.priorityQueue.findIndex(([_, h]) => h > node.heuristic);
        if (insertIndex === -1) {
            insertIndex = this.priorityQueue.length;
        }

        this.priorityQueue.splice(insertIndex, 0, entry);
    }

    reconstructPath() {
        if (!this.targetNode) return;

        this.solutionPath = [];
        let current = this.targetNode;

        while (current) {
            this.solutionPath.unshift(current);
            current = current.parent;
        }
    }

    reset(fullReset = true) {
        if (this.nodes.length === 0) return;

        this.nodes.forEach(node => {
            node.reset();
            node.isTarget = false;
        });

        this.priorityQueue = [];
        this.visitedNodes = [];
        this.solutionPath = [];
        this.pathFound = false;
        this.algorithmRunning = false;
        this.currentNode = null;

        if (fullReset) {
            this.targetNode = null;
        } else if (this.targetNode) {
            this.targetNode.isTarget = true;
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

            const isPathEdge = this.isEdgeInSolutionPath(node1, node2);
            if (isPathEdge) {
                edgeEl.classList.add('solution-path');
            }
            else if (node1.visited && node2.visited) {
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

        this.nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `node level-${node.level}`;
            nodeEl.textContent = node.id;
            nodeEl.style.left = `${node.x - 25}px`;
            nodeEl.style.top = `${node.y - 25}px`;

            if (this.targetNode && node.heuristic !== Infinity) {
                const heuristicLabel = document.createElement('div');
                heuristicLabel.className = 'heuristic-label';
                heuristicLabel.textContent = `h=${node.heuristic.toFixed(0)}`;
                heuristicLabel.style.position = 'absolute';
                heuristicLabel.style.top = '-25px';
                heuristicLabel.style.left = '0';
                heuristicLabel.style.width = '100%';
                heuristicLabel.style.textAlign = 'center';
                heuristicLabel.style.fontSize = '12px';
                heuristicLabel.style.fontWeight = 'bold';
                heuristicLabel.style.color = '#333';
                heuristicLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                heuristicLabel.style.borderRadius = '10px';
                heuristicLabel.style.padding = '2px 0';
                nodeEl.appendChild(heuristicLabel);
            }

            if (node === this.currentNode) {
                nodeEl.classList.add('current');
            }

            if (node === this.targetNode) {
                nodeEl.classList.add('target-node');
            }

            if (node === this.startNode) {
                nodeEl.classList.add('start-node');
            }

            if (node.visited) {
                nodeEl.classList.add('visited');
            }

            if (node.inQueue) {
                nodeEl.classList.add('in-queue');
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
        document.getElementById('visited-nodes').textContent = `Visited Nodes: ${this.visitedNodes.map(node => node.id).join(', ') || 'None'}`;

        if (this.solutionPath.length > 0) {
            document.getElementById('solution-path').textContent = `Solution Path: ${this.solutionPath.map(node => node.id).join(' → ')}`;
        } else {
            document.getElementById('solution-path').textContent = 'Solution Path: None';
        }

        this.updateQueueDisplay();
    }

    updateQueueDisplay() {
        this.queueContainer.innerHTML = '';
        document.querySelector('.queue-label').textContent = "Priority Queue (by heuristic):";

        if (this.priorityQueue.length === 0) {
            return;
        }

        this.priorityQueue.forEach(([nodeId, heuristic]) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `${nodeId}<span style="font-size: 9px; display: block;">h=${heuristic.toFixed(0)}</span>`;
            this.queueContainer.appendChild(queueItem);
        });
    }
}

const graph = new BestFirstSearch();

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

document.getElementById('bestFirstButton').classList.add('active');