# AI-Powered Criminal Network Analysis System

A full-stack intelligence platform for analyzing criminal investigations, linking fragmented evidence, and uncovering hidden relationships across people, phones, accounts, devices, locations, and FIR records.

## Project Overview

This project is designed for law-enforcement-style investigation workflows where evidence is spread across PDFs, scanned FIR documents, telecom records, and structured case data. Instead of manually reading each file and trying to connect the dots, the system combines OCR, AI-based entity extraction, graph analytics, and an interactive dashboard to help investigators identify patterns, relationships, and suspicious connections faster.

The application is built as a modern two-part system:

- Frontend: React + Vite dashboard for investigation, graph browsing, map exploration, and reporting.
- Backend: Express + TypeScript API with MongoDB, Neo4j, OCR processing, AI-powered relationship extraction, analytics, and retrieval-augmented investigation assistance.

## What This Project Does

This system helps users do the following:

1. Upload FIR documents and related evidence files
2. Extract text from PDFs and scanned images using OCR
3. Detect entities such as people, phones, accounts, devices, locations, and cases
4. Resolve duplicate or partially matching records across multiple sources
5. Build a criminal knowledge graph using Neo4j
6. Identify evidence-backed relationships between entities
7. Explore connections visually through a graph interface
8. Analyze crime trends by district, police station, category, and demographics
9. View incidents on an interactive map
10. Ask investigations questions through an AI-powered RAG assistant grounded in uploaded evidence

## Problem It Solves

Traditional investigations often suffer from several major problems:

- Evidence exists in multiple formats such as PDFs, scanned pages, and structured records
- Investigators must manually correlate identities, phones, accounts, devices, and locations
- Important relationships are often hidden across multiple FIRs and records
- Case data is fragmented, making it difficult to spot repeat offenders or networks
- A lot of critical analysis depends on human memory and repetitive document review

This project solves those problems by combining OCR, entity detection, graph intelligence, and analytics into one system that helps investigators move from raw documents to actionable insight.

## Unique Factors of This Project

### 1. AI + Graph Intelligence

The platform does more than store documents. It converts evidence into a graph of connected entities and relationships, making hidden criminal networks easier to discover.

### 2. Evidence-Backed Relationship Extraction

Relationships are not created just because two entities appear together in a document. The system uses evidence-backed rules and extracted signals so that graph edges are grounded in actual findings.

### 3. Entity Resolution and Deduplication

Names, phones, devices, accounts, and locations are normalized and matched carefully so the system can surface duplicates and probable matches without blindly merging records.

### 4. Interactive Investigation Dashboard

The frontend gives investigators a streamlined command-center experience with dashboards, graph exploration, map visualization, reports, and protected investigation flows.

### 5. AI Investigation Assistant (RAG)

The backend includes a retrieval-augmented question-answering layer that searches OCR text, evidence records, and graph context to help answer investigation questions with source-backed results.

### 6. Real-World Intelligence Workflow

This project is designed around the lifecycle of a case:

- intake documents
- OCR and extraction
- entity resolution
- graph projection
- relationship discovery
- analytics and map insights
- reporting and investigation support

## Included Sample PDFs

The project already contains sample PDF and related uploaded content that can be used for testing and demonstration:

- `server/src/uploads/fictional_fir_test_sample.pdf`
- `server/src/uploads/arun new.pdf`
- `server/src/uploads/Gemini_Generated_Image_c9q0tqc9q0tqc9q0.pdf`

These samples are useful for validating OCR, entity extraction, FIR ingestion, and document processing workflows.

## Core Features

### Frontend

- Landing page and authentication flow
- Investigation dashboard
- Network graph visualization
- Crime map page
- Reports and alerts section
- Protected routes for authenticated users

### Backend

- Express API for uploads, FIR management, analytics, graph operations, and RAG
- MongoDB storage for FIRs, OCR results, entities, and evidence relationships
- Neo4j graph database for criminal network modeling
- OCR pipeline using PDF/image processing and Tesseract
- AI-assisted relationship extraction and retrieval workflows
- Secure middleware, role-based access control, and validation

### Investigation Capabilities

- FIR creation and retrieval
- Entity extraction from uploaded files
- Graph queries for neighbors, shortest paths, and case networks
- Crime category, district, demographic, and graph analytics
- Map-based overview of crime concentration and police station data
- AI-backed Q&A support over evidence and graph context

## Architecture

The system follows a modular architecture:

```text
client/                 React frontend
server/                Express + TypeScript backend
  src/
    app/                Express app setup
    config/             env, database, Neo4j, logger config
    modules/            auth, case, graph, analytics, map, rag, file handling
    models/             MongoDB models
    service/            OCR, entity normalization, extraction services
    graph/              graph routes, controllers, analytics helpers
    uploads/            sample documents and generated OCR assets
```

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Leaflet / map UI
- Cytoscape / graph rendering
- GSAP animations

### Backend

- Node.js
- TypeScript
- Express
- MongoDB + Mongoose
- Neo4j
- OCR / PDF processing libraries
- JWT authentication and validation
- LangChain / Mistral integration for AI assistance

## How It Works

1. A user uploads a FIR document or related evidence file.
2. The backend processes the document and extracts text from PDFs or images.
3. Entities such as names, phone numbers, devices, locations, and accounts are identified.
4. The system normalizes and resolves duplicate or similar entities.
5. These entities are projected into Neo4j to generate a criminal network graph.
6. Evidence-backed relationships are created between graph nodes.
7. Investigators can explore the graph, analytics, and map views.
8. A RAG assistant can answer questions based on the uploaded evidence and graph context.

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- Node.js installed
- MongoDB running
- Neo4j running
- A Mistral API key for AI-powered responses

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI-Powered-Criminal-Network-Analysis-System
```

### 2. Install Client Dependencies

```bash
cd client
npm install
```

### 3. Install Server Dependencies

```bash
cd ../server
npm install
```

### 4. Configure Environment Variables

Copy the sample environment file in the server folder and update values for your local setup:

```bash
cp .env.example .env
```

Update the following values in `.env`:

- `DATABASE_URL`
- `CLIENT_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `NEO4J_DATABASE`
- `MISTRAL_API_KEY`

### 5. Run the Application

#### Start the backend

```bash
cd server
npm run dev
```

#### Start the frontend

```bash
cd client
npm run dev
```

## Project Structure

```text
AI-Powered-Criminal-Network-Analysis-System/
├── client/                  # Frontend application
├── server/                  # Backend application
├── README.md                # Project overview
├── .gitignore
└── ...
```

## Use Cases

This project is useful for:

- Criminal investigation teams
- Cybercrime and telecom analysis units
- Intelligence and fraud analysis departments
- Case management teams handling large volumes of evidence
- Security teams needing graph-based pattern discovery

## Benefits

- Faster evidence review
- Better entity correlation across multiple sources
- Hidden network detection through graph intelligence
- Reduced manual workload for investigators
- More structured and explainable analysis results

## Notes

This project is intended for investigative, analytical, and research purposes. It is especially valuable when evidence is spread across several documents and investigators need a unified view of the case ecosystem.

## Summary

The AI-Powered Criminal Network Analysis System is a modern investigative platform that turns raw evidence into structured, connected intelligence. It addresses the real-world challenge of fragmented investigation data by combining OCR, AI-based extraction, graph analytics, dashboard visualization, and retrieval-augmented analysis into one unified solution.

Its strongest differentiator is the combination of intelligence extraction and network analysis, making it more than just a document viewer or case tracker. It helps users understand who is connected to whom, how evidence connects across cases, and what patterns may be emerging within criminal networks.
