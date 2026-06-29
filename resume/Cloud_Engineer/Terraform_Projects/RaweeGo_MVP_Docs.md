# RaweeGo MVP - Terraform Documentation

## Overview
This directory contains the Terraform infrastructure-as-code (IaC) for the **RaweeGo MVP** deployment on Microsoft Azure. The architecture supports an AI-powered document-to-audio platform utilizing OCR and LLMOps pipelines.

## Architecture & Modules

The infrastructure is modularized and orchestrated via the root `main.tf`, ensuring all resources are logically grouped into a single Azure Resource Group.

### 1. Compute Module (`./modules/compute`)
Provisions the core application and AI processing resources:
- **Azure Container Apps Environment** (`cae-raweego`)
- **Azure Container App** (`ca-raweego-api`): Hosts the core API. Configured with 0.5 CPU and 1.0Gi memory.
- **Linux Virtual Machine** (`vm-raweego-worker`): Dedicated VM (`Standard_B2s`) for the LLMOps pipeline (Gunicorn and Python services) responsible for OCR and natural voice audio generation.

### 2. Database Module (`./modules/database`)
Provisions the relational datastore:
- **Azure Database for PostgreSQL Flexible Server** (`pg-raweego-mvp`)
  - **Version:** 13
  - **Compute Tier:** Burstable `B_Standard_B1ms`
  - **Storage:** 32 GB

### 3. Storage Module (`./modules/storage`)
Provisions scalable blob storage for document processing and generated audio streams:
- **Azure Storage Account** (`saraweegomvp`): Configured with the Standard tier and Locally Redundant Storage (LRS) replication.

## Deployment Instructions

1. Initialize Terraform to download the required AzureRM provider and modules:
   ```bash
   terraform init
   ```
2. Review the execution plan to verify resource creation:
   ```bash
   terraform plan
   ```
3. Apply the configuration to provision the Azure resources:
   ```bash
   terraform apply
   ```
