# DigitalOcean Terraform Configuration
# Much simpler than AWS - just needs an API token!

terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token = var.do_token
}

# Variables
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "ssh_key_fingerprint" {
  description = "SSH key fingerprint"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "size" {
  description = "Droplet size"
  type        = string
  default     = "s-1vcpu-1gb"  # $6/month
}

variable "image" {
  description = "Droplet image"
  type        = string
  default     = "ubuntu-22-04-x64"
}

variable "vm_count" {
  description = "Number of VMs to create"
  type        = number
  default     = 3
}

# Get SSH key
data "digitalocean_ssh_key" "chrome_vm_key" {
  fingerprint = var.ssh_key_fingerprint
}

# Create VMs
resource "digitalocean_droplet" "chrome_vm" {
  count  = var.vm_count
  name   = "chrome-vm-${count.index + 1}"
  image  = var.image
  region = var.region
  size   = var.size

  ssh_keys = [data.digitalocean_ssh_key.chrome_vm_key.id]

  # User data script to install Chrome VM setup
  user_data = file("${path.module}/user-data.sh")

  tags = ["chrome-vm", "browser-farm"]
}

# Output VM information
output "vm_ips" {
  description = "IP addresses of created VMs"
  value = {
    for i, vm in digitalocean_droplet.chrome_vm : 
    "chrome-vm-${i + 1}" => vm.ipv4_address
  }
}

output "vm_info" {
  description = "VM information for dashboard"
  value = [
    for i, vm in digitalocean_droplet.chrome_vm : {
      id = vm.id
      name = vm.name
      ip = vm.ipv4_address
      status = "initializing"
      created_at = vm.created_at
    }
  ]
}

