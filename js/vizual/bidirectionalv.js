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
        this.visitedForward = false;
        this.inQueueForward = false;
        this.parentForward = null;
        this.visitedBackward = false;
        this.inQueueBackward = false;
        this.parentBackward = null;
    }

    connect(node, weight = null) {
        if (!this.connections.includes(node)) {
            this.connections.push(node);
            node.connections.push(this);
        }
    }

    reset() {
        this.visitedForward = false;
        this.inQueueForward = false;
        this.parentForward = null;
        this.visitedBackward = false;
        this.inQueueBackward = false;
        this.parentBackward = null;
    }
}

class BidirectionalGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.forwardQueue = []; // Queue for forward search
        this.backwardQueue = []; // Queue for backward search
        this.visitedNodesForward = [];
        this.visitedNodesBackward = [];
        this.currentNodeForward = null;
        this.currentNodeBackward = null;
        this.startNode = null;
        this.endNode = null;
        this.meetingNode = null;
        this.pathFound = false;
        this.solutionPath = [];
        this.algorithmRunning = false;
        this.searchDirection = 'forward';

        this.nextStepButton = document.getElementById('nextStep');
        this.resetButton = document.getElementById('reset');
        this.generateButton = document.getElementById('generate');
        this.messageBox = document.getElementById('messageBox');
        this.queueContainer = document.getElementById('queueItems');

        this.generate = this.generate.bind(this);
        this.nextStep = this.nextStep.bind(this);
        this.reset = this.reset.bind(this);
        this.updateUI = this.updateUI.bind(this);
        this.toggleEndNode = this.toggleEndNode.bind(this);

        this.nextStepButton.addEventListener('click', this.nextStep);
        this.resetButton.addEventListener('click', this.reset);
        this.generateButton.addEventListener('click', this.generate);

        document.querySelector('h1').textContent = "Bidirectional Search Visualization";
        const description = document.querySelector('.algorithm-description');
        description.innerHTML = `
            <h3>How Bidirectional Search Works:</h3>
            <p>Bidirectional search runs two simultaneous breadth-first searches: 
               one forward from the source and one backward from the destination.</p>
            <p>The algorithm terminates when the two searches meet, dramatically reducing the search space compared to a standard BFS.</p>
            <p>In this visualization, you can:</p>
            <ul>
                <li>Generate a new random graph with 4 levels</li>
                <li>Select a target node by clicking on it</li>
                <li>Step through the bidirectional search algorithm manually</li>
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

        const level1Count = Math.floor(Math.random() * 2) + 2;
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

        const level2Nodes = this.nodes.filter(node => node.level === 2);
        level2Nodes.forEach(parentNode => {
            const childCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < childCount; i++) {
                const node = new Node(this.nodes.length + 1, 3);
                this.nodes.push(node);
                parentNode.connect(node);
                this.edges.push(new Edge(parentNode, node));
            }
        });

        this.positionNodes();

        this.startNode = root;
        this.currentNodeForward = null;
        this.currentNodeBackward = null;
        this.endNode = null;
        this.meetingNode = null;

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

        const level3Nodes = this.nodes.filter(node => node.level === 3);
        const nodesByParent2 = {};

        level3Nodes.forEach(node => {
            const parent = this.edges.find(edge =>
                (edge.node1 === node && edge.node2.level === 2) ||
                (edge.node2 === node && edge.node1.level === 2)
            );
            const parentNode = parent.node1.level === 2 ? parent.node1 : parent.node2;
            if (!nodesByParent2[parentNode.id]) {
                nodesByParent2[parentNode.id] = [];
            }
            nodesByParent2[parentNode.id].push(node);
        });

        for (const parentId in nodesByParent2) {
            const parent = this.nodes.find(node => node.id === parseInt(parentId));
            const children = nodesByParent2[parentId];
            const parentWidth = width / level2Nodes.length;
            const step = parentWidth / (children.length + 1);

            children.forEach((node, index) => {
                const offset = (index + 1) * step - parentWidth / 2;
                node.x = parent.x + offset * 0.5;
                node.y = height * 0.75;
            });
        }
    }

    toggleEndNode(node) {
        if (!this.algorithmRunning && node !== this.startNode) {
            this.endNode = this.endNode === node ? null : node;

            this.updateUI();
            document.getElementById('end-node').textContent = `Target Node: ${this.endNode ? this.endNode.id : 'None'}`;
            this.nextStepButton.disabled = !this.endNode;
        }
    }

    nextStep() {
        if (this.pathFound) {
            return;
        }

        if (!this.algorithmRunning) {
            if (this.startNode && this.endNode) {
                this.algorithmRunning = true;

                this.addToQueue(this.startNode, 'forward');

                this.addToQueue(this.endNode, 'backward');

                this.updateButtons(false, true);
                this.updateUI();
                return;
            } else if (!this.endNode) {
                this.showMessage("Please select a target node");
                return;
            }
        }

        if (this.forwardQueue.length === 0 || this.backwardQueue.length === 0) {
            this.showMessage("No path found from start to target!");
            this.algorithmRunning = false;
            this.updateButtons(true, false);
            return;
        }

        if (this.searchDirection === 'forward') {
            this.forwardStep();
            this.searchDirection = 'backward';
        } else {
            this.backwardStep();
            this.searchDirection = 'forward';
        }

        this.checkForMeeting();

        this.updateUI();
    }

    forwardStep() {
        const currentNodeId = this.forwardQueue.shift();
        this.currentNodeForward = this.nodes.find(node => node.id === currentNodeId);
        this.currentNodeForward.inQueueForward = false;

        if (this.currentNodeForward.visitedForward) {
            return;
        }

        this.currentNodeForward.visitedForward = true;
        this.visitedNodesForward.push(this.currentNodeForward);

        this.addNeighborsToQueue(this.currentNodeForward, 'forward');
    }

    backwardStep() {
        const currentNodeId = this.backwardQueue.shift();
        this.currentNodeBackward = this.nodes.find(node => node.id === currentNodeId);
        this.currentNodeBackward.inQueueBackward = false;

        if (this.currentNodeBackward.visitedBackward) {
            return;
        }

        this.currentNodeBackward.visitedBackward = true;
        this.visitedNodesBackward.push(this.currentNodeBackward);

        this.addNeighborsToQueue(this.currentNodeBackward, 'backward');
    }

    addNeighborsToQueue(node, direction) {
        const connectedEdges = this.edges.filter(edge =>
            edge.node1 === node || edge.node2 === node
        );

        for (const edge of connectedEdges) {
            const neighbor = edge.node1 === node ? edge.node2 : edge.node1;

            if (direction === 'forward' && !neighbor.visitedForward && !neighbor.inQueueForward) {
                neighbor.parentForward = node;
                this.addToQueue(neighbor, 'forward');
            }

            if (direction === 'backward' && !neighbor.visitedBackward && !neighbor.inQueueBackward) {
                neighbor.parentBackward = node;
                this.addToQueue(neighbor, 'backward');
            }
        }
    }

    addToQueue(node, direction) {
        if (direction === 'forward') {
            node.inQueueForward = true;
            this.forwardQueue.push(node.id);
        } else {
            node.inQueueBackward = true;
            this.backwardQueue.push(node.id);
        }
    }

    checkForMeeting() {
        for (const node of this.nodes) {
            if (node.visitedForward && node.visitedBackward) {
                this.meetingNode = node;
                this.pathFound = true;
                this.reconstructPath();
                this.showMessage(`Path found! The searches met at node ${node.id}`);
                this.algorithmRunning = false;
                this.updateButtons(true, false);
                return;
            }
        }
    }

    reconstructPath() {
        if (!this.meetingNode) return;

        let forwardPath = [];
        let current = this.meetingNode;
        while (current) {
            forwardPath.unshift(current);
            current = current.parentForward;
        }

        let backwardPath = [];
        current = this.meetingNode.parentBackward;
        while (current) {
            backwardPath.push(current);
            current = current.parentBackward;
        }

        this.solutionPath = [...forwardPath, ...backwardPath];
    }

    reset(fullReset = true) {
        if (this.nodes.length === 0) return;

        this.nodes.forEach(node => node.reset());

        this.forwardQueue = [];
        this.backwardQueue = [];
        this.visitedNodesForward = [];
        this.visitedNodesBackward = [];
        this.solutionPath = [];
        this.pathFound = false;
        this.algorithmRunning = false;
        this.currentNodeForward = null;
        this.currentNodeBackward = null;
        this.meetingNode = null;
        this.searchDirection = 'forward';

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
            else if (node1.visitedForward && node2.visitedForward) {
                edgeEl.classList.add('traversed-forward');
            }
            else if (node1.visitedBackward && node2.visitedBackward) {
                edgeEl.classList.add('traversed-backward');
            }

            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            edgeEl.style.width = `${length}px`;
            edgeEl.style.left = `${node1.x}px`;
            edgeEl.style.top = `${node1.y}px`;
            edgeEl.style.transform = `rotate(${angle}deg)`;

            if (isPathEdge) {
                const arrow = document.createElement('div');
                arrow.className = 'edge-arrow';
                arrow.style.borderLeftColor = '#2ecc71';
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

            if (node === this.currentNodeForward) {
                nodeEl.classList.add('current-forward');
            }

            if (node === this.currentNodeBackward) {
                nodeEl.classList.add('current-backward');
            }

            if (node === this.meetingNode) {
                nodeEl.classList.add('meeting-node');
            }

            if (node === this.endNode) {
                nodeEl.classList.add('end-node');
            }

            if (node.visitedForward) {
                nodeEl.classList.add('visited-forward');
            }

            if (node.visitedBackward) {
                nodeEl.classList.add('visited-backward');
            }

            if (node.inQueueForward) {
                nodeEl.classList.add('in-queue-forward');
            }

            if (node.inQueueBackward) {
                nodeEl.classList.add('in-queue-backward');
            }

            nodeEl.addEventListener('click', () => {
                if (!this.algorithmRunning && node !== this.startNode) {
                    this.toggleEndNode(node);
                }
            });

            container.appendChild(nodeEl);
        });

        document.getElementById('current-node').textContent = `Forward Node: ${this.currentNodeForward ? this.currentNodeForward.id : this.startNode ? this.startNode.id : 'None'} | Backward Node: ${this.currentNodeBackward ? this.currentNodeBackward.id : this.endNode ? this.endNode.id : 'None'}`;
        document.getElementById('end-node').textContent = `Target Node: ${this.endNode ? this.endNode.id : 'None (Click on a node to set as target)'}`;
        document.getElementById('visited-nodes').textContent = `Nodes Visited (Forward): ${this.visitedNodesForward.map(node => node.id).join(', ') || 'None'} | Nodes Visited (Backward): ${this.visitedNodesBackward.map(node => node.id).join(', ') || 'None'}`;
        document.getElementById('meeting-node').textContent = `Meeting Node: ${this.meetingNode ? this.meetingNode.id : 'None yet'}`;

        this.updateQueueDisplay();
    }

    updateQueueDisplay() {
        this.queueContainer.innerHTML = '';
        document.querySelector('.queue-label').textContent = "Bidirectional Queues:";

        const forwardQueueHeader = document.createElement('div');
        forwardQueueHeader.className = 'queue-header';
        forwardQueueHeader.textContent = 'Forward Queue (from start):';
        forwardQueueHeader.style.color = '#3498db';
        forwardQueueHeader.style.fontWeight = 'bold';
        this.queueContainer.appendChild(forwardQueueHeader);

        if (this.forwardQueue.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'Empty';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.margin = '5px 0';
            this.queueContainer.appendChild(emptyMsg);
        } else {
            const forwardQueueContainer = document.createElement('div');
            forwardQueueContainer.className = 'queue-content';
            forwardQueueContainer.style.display = 'flex';
            forwardQueueContainer.style.flexWrap = 'wrap';
            forwardQueueContainer.style.gap = '5px';
            forwardQueueContainer.style.margin = '5px 0 15px 0';

            this.forwardQueue.forEach(nodeId => {
                const queueItem = document.createElement('div');
                queueItem.className = 'queue-item forward';
                queueItem.textContent = nodeId;
                queueItem.style.backgroundColor = '#d6eaf8';
                queueItem.style.borderColor = '#3498db';
                forwardQueueContainer.appendChild(queueItem);
            });

            this.queueContainer.appendChild(forwardQueueContainer);
        }

        const backwardQueueHeader = document.createElement('div');
        backwardQueueHeader.className = 'queue-header';
        backwardQueueHeader.textContent = 'Backward Queue (from target):';
        backwardQueueHeader.style.color = '#e74c3c';
        backwardQueueHeader.style.fontWeight = 'bold';
        this.queueContainer.appendChild(backwardQueueHeader);

        if (this.backwardQueue.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'Empty';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.margin = '5px 0';
            this.queueContainer.appendChild(emptyMsg);
        } else {
            const backwardQueueContainer = document.createElement('div');
            backwardQueueContainer.className = 'queue-content';
            backwardQueueContainer.style.display = 'flex';
            backwardQueueContainer.style.flexWrap = 'wrap';
            backwardQueueContainer.style.gap = '5px';
            backwardQueueContainer.style.margin = '5px 0';

            this.backwardQueue.forEach(nodeId => {
                const queueItem = document.createElement('div');
                queueItem.className = 'queue-item backward';
                queueItem.textContent = nodeId;
                queueItem.style.backgroundColor = '#fadbd8';
                queueItem.style.borderColor = '#e74c3c';
                backwardQueueContainer.appendChild(queueItem);
            });

            this.queueContainer.appendChild(backwardQueueContainer);
        }
    }
}

const graph = new BidirectionalGraph();

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

document.getElementById('bidirectionalButton').classList.add('active');