# 🖥️ PetAdopt - Backend Server

A high-performance, secure Node.js and Express REST API backing the PetAdopt application. This layer manages persistence directly inside a structured MongoDB database and enforces strict validation schemas to secure the pet listing and adoption workflow.

---

## 🚀 Purpose
The primary purpose of the **PetAdopt Server** is to manage state data safely, govern structural security validations, query indexed entries, and enforce strict business logic to prevent database manipulation or duplicate request submissions.

---

## ✨ Features (Backend)
* **Self-Adoption Restriction (Ownership Guardrail):** Strict server-side verification matching incoming request metadata with database records, instantly preventing listing owners from adopting their own listed pets with a `403 Forbidden` response.
* **Idempotent Adoption Logic:** High-fidelity database queries that check for preexisting adoption documents under the same user, completely neutralizing duplicate entries and route spamming.
* **JWKS Cryptographic Security Validation:** Secure route middleware tracking authorization tokens using remote JWKS keysets to identify authenticated traffic and safeguard sensitive endpoints.
* **Dynamic Database Aggregation:** Scalable query handlers supporting advanced regex patterns for real-time text search, exact state matching, and conditional collection sorting parameters.
* **Optimized Serverless Core:** Clean modular structure engineered for ultra-fast compilation and minimal cold-start execution on edge infrastructure (Vercel Production environment).

---

## 📦 NPM Packages Used
* `express` - Minimalist and fast web routing framework for Node.js.
* `mongodb` - Official native MongoDB driver optimized for fast CRUD execution and ObjectId handling.
* `jose-cjs` - CommonJS cryptographic framework used for JSON Web Tokens verifying remote JWKS signatures.
* `dotenv` - Zero-dependency configuration loader managing environment variables safely.
* `cors` - Security middleware implementing Cross-Origin Resource Sharing controls.
