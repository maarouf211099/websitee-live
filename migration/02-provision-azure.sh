#!/usr/bin/env bash
# Mersal → Azure | Step 2: create the Azure resources (run from Azure Cloud Shell or any machine with `az login`)
# Creates: resource group, VNet + NSG, a Windows Server 2022 VM for IIS (web) and a
# SQL Server 2022 VM (db) on a private subnet. Nothing here touches the current server.
set -euo pipefail

RG="${RG:-rg-mersal-prod}"
LOC="${LOC:-uaenorth}"             # closest Azure region to Egypt; westeurope is the cheaper fallback
ADMIN_USER="${ADMIN_USER:-mersaladmin}"
ADMIN_IP="${ADMIN_IP:?set ADMIN_IP to your office public IP (RDP is allowed only from it)}"
WEB_SIZE="${WEB_SIZE:-Standard_D2s_v5}"   # 2 vCPU / 8 GB — adjust after the inventory
DB_SIZE="${DB_SIZE:-Standard_E2s_v5}"     # 2 vCPU / 16 GB
SQL_IMAGE="${SQL_IMAGE:-MicrosoftSQLServer:sql2022-ws2022:web-gen2:latest}"  # SQL "Web" edition: cheapest licence allowed for public websites

read -r -s -p "VM admin password (new, 12+ chars): " ADMIN_PASS; echo

az group create -n "$RG" -l "$LOC" -o none
az network vnet create -g "$RG" -n vnet-mersal --address-prefixes 10.20.0.0/16 \
  --subnet-name snet-web --subnet-prefixes 10.20.1.0/24 -o none
az network vnet subnet create -g "$RG" --vnet-name vnet-mersal -n snet-db --address-prefixes 10.20.2.0/24 -o none

# Web NSG: 80/443 from anywhere, RDP only from the admin IP
az network nsg create -g "$RG" -n nsg-web -o none
az network nsg rule create -g "$RG" --nsg-name nsg-web -n allow-http-https --priority 100 \
  --destination-port-ranges 80 443 --access Allow --protocol Tcp -o none
az network nsg rule create -g "$RG" --nsg-name nsg-web -n allow-rdp-admin --priority 110 \
  --source-address-prefixes "$ADMIN_IP" --destination-port-ranges 3389 --access Allow --protocol Tcp -o none
az network vnet subnet update -g "$RG" --vnet-name vnet-mersal -n snet-web --network-security-group nsg-web -o none

# DB NSG: SQL only from the web subnet; no public IP at all
az network nsg create -g "$RG" -n nsg-db -o none
az network nsg rule create -g "$RG" --nsg-name nsg-db -n allow-sql-from-web --priority 100 \
  --source-address-prefixes 10.20.1.0/24 --destination-port-ranges 1433 --access Allow --protocol Tcp -o none
az network vnet subnet update -g "$RG" --vnet-name vnet-mersal -n snet-db --network-security-group nsg-db -o none

az network public-ip create -g "$RG" -n pip-mersal-web --sku Standard --allocation-method Static -o none

az vm create -g "$RG" -n vm-mersal-web --image MicrosoftWindowsServer:WindowsServer:2022-datacenter-azure-edition:latest \
  --size "$WEB_SIZE" --admin-username "$ADMIN_USER" --admin-password "$ADMIN_PASS" \
  --vnet-name vnet-mersal --subnet snet-web --nsg "" --public-ip-address pip-mersal-web \
  --os-disk-size-gb 256 --storage-sku Premium_LRS -o none

az vm create -g "$RG" -n vm-mersal-db --image "$SQL_IMAGE" \
  --size "$DB_SIZE" --admin-username "$ADMIN_USER" --admin-password "$ADMIN_PASS" \
  --vnet-name vnet-mersal --subnet snet-db --nsg "" --public-ip-address "" \
  --data-disk-sizes-gb 256 --storage-sku Premium_LRS -o none
az sql vm create -g "$RG" -n vm-mersal-db --license-type PAYG --sql-mgmt-type Full -o none || true

# Storage account for the DB backup transfer and, later, user uploads (Blob)
SA="stmersal$RANDOM"
az storage account create -g "$RG" -n "$SA" -l "$LOC" --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false -o none
az storage container create --account-name "$SA" -n migration --auth-mode login -o none || true

# Nightly VM backups
az backup vault create -g "$RG" -n rsv-mersal -l "$LOC" -o none
az backup protection enable-for-vm -g "$RG" --vault-name rsv-mersal --vm vm-mersal-web --policy-name DefaultPolicy -o none
az backup protection enable-for-vm -g "$RG" --vault-name rsv-mersal --vm vm-mersal-db  --policy-name DefaultPolicy -o none

echo "Web VM public IP : $(az network public-ip show -g "$RG" -n pip-mersal-web --query ipAddress -o tsv)"
echo "DB VM private IP : $(az vm list-ip-addresses -g "$RG" -n vm-mersal-db --query '[0].virtualMachine.network.privateIpAddresses[0]' -o tsv)"
echo "Storage account  : $SA"
