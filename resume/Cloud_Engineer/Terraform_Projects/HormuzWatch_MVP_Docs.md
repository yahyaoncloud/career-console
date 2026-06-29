# HormuzWatch MVP - Terraform Documentation

## Overview
This directory contains the Terraform infrastructure-as-code (IaC) for the **HormuzWatch MVP** deployment on Microsoft Azure. The architecture focuses on real-time continuous telemetry ingestion, low-latency event processing, and live geospatial queries.

## Architecture & Modules

The infrastructure is broken down into modular components invoked from the root `main.tf`, all deployed into a unified Azure Resource Group.

### 1. Compute Module (`./modules/compute`)
Provisions the core processing resources:
- **Azure Container Apps Environment** (`cae-hormuzwatch`)
- **Azure Container App** (`ca-hormuzwatch-api`): Hosts the real-time WebSocket fanout API (Go). Configured with 0.5 CPU and 1.0Gi memory.
- **Linux Virtual Machine** (`vm-hormuzwatch-worker`): Hosts scalable Python workers for anomaly detection. Provisioned as `Standard_B2s` with Ubuntu.

### 2. Database Module (`./modules/database`)
Provisions the relational database:
- **Azure Database for PostgreSQL Flexible Server** (`pg-hormuzwatch-mvp`)
  - **Version:** 13
  - **Compute Tier:** Burstable `B_Standard_B1ms`
  - **Storage:** 32 GB

### 3. Event Hubs Module (`./modules/eventhubs`)
Provisions the high-throughput message ingestion system:
- **Event Hub Namespace** (`ehns-hormuzwatch-mvp`): Standard SKU, 1 Capacity Unit.
- **Event Hub** (`eh-telemetry`): Configured with 4 partitions and 1-day message retention to act as the primary decoupled ingestion spine, preventing database backpressure.

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
