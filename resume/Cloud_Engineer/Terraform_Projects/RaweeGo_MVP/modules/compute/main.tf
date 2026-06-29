resource "azurerm_container_app_environment" "env" {
  name                = "cae-raweego"
  resource_group_name = var.resource_group_name
  location            = var.location
}

resource "azurerm_container_app" "api" {
  name                         = "ca-raweego-api"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  template {
    container {
      name   = "api"
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
      cpu    = 0.5
      memory = "1.0Gi"
    }
  }
}

resource "azurerm_linux_virtual_machine" "worker" {
  name                = "vm-raweego-worker"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "Standard_B2s"
  admin_username      = "adminuser"
  # network_interface_ids, os_disk, source_image_reference omitted for brevity
}
