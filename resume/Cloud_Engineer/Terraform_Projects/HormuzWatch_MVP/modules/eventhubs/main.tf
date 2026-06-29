resource "azurerm_eventhub_namespace" "ehns" {
  name                = "ehns-hormuzwatch-mvp"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  capacity            = 1
}

resource "azurerm_eventhub" "eh" {
  name                = "eh-telemetry"
  namespace_name      = azurerm_eventhub_namespace.ehns.name
  resource_group_name = var.resource_group_name
  partition_count     = 4
  message_retention   = 1
}
