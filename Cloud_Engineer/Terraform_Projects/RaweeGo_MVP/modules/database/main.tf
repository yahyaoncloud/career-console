resource "azurerm_postgresql_flexible_server" "pg" {
  name                = "pg-raweego-mvp"
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = "13"
  administrator_login = "psqladmin"
  administrator_password = "Password1234!"
  storage_mb          = 32768
  sku_name            = "B_Standard_B1ms"
}
