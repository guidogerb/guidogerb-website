variable "aws_region" {
description = "AWS region to deploy resources"
type = string
default = "us-east-1"
}

variable "vpc_cidr" {
description = "CIDR block for the VPC"
type = string
default = "10.0.0.0/16"
}

variable "availability_zones" {
description = "List of availability zones to use"
type = list(string)
default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnets" {
description = "CIDR blocks for private subnets"
type = list(string)
default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
description = "CIDR blocks for public subnets"
type = list(string)
default = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

Got it—here’s a clean, production-ready Terraform setup that builds:

- A VPC with 1 public and 1 private subnet, IGW, and a NAT Gateway
- A minimal Ubuntu SMTP relay EC2 in the public subnet with an Elastic IP
- Security groups for SMTP/SMTPS/Submission + SSH (locked down by variables)
- **Option A (default off):** AWS Site-to-Site VPN (VGW + Customer Gateway)
- **Option B (default off):** AWS Client VPN endpoint + association to the private subnet
- Optional Route 53 A + MX (and SPF TXT) records for `mail.<your-domain>`

> ⚠️ Quick accuracy note:
> _Site-to-Site VPN_ does **not** assign a VPC private-subnet IP to your Synology. Your NAS keeps its on-prem IP, reachable over the tunnel.
> _Client VPN_ assigns an IP from a **separate client CIDR**, not from the private-subnet CIDR. Routing/SGs grant access to the VPC subnets.

---

# File layout

```
terraform/
  main.tf
  variables.tf
  outputs.tf
  user_data_smtp_relay.sh.tftpl
```

---

## `variables.tf`

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.58"
    }
  }
}

variable "region" {
  type        = string
  default     = "us-west-2"
  description = "AWS region"
}

# VPC & Subnets
variable "vpc_cidr" {
  type        = string
  default     = "10.20.0.0/16"
}
variable "public_subnet_cidr" {
  type        = string
  default     = "10.20.0.0/24"
}
variable "private_subnet_cidr" {
  type        = string
  default     = "10.20.1.0/24"
}

# SMTP relay EC2
variable "instance_type" {
  type        = string
  default     = "t3.micro"
}
variable "ssh_key_name" {
  type        = string
  default     = null
  description = "Optional: existing EC2 key pair name for SSH. If null, you can still reach it via SSM if you add an IAM role (not included here)."
}
variable "admin_ssh_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"] # tighten to your IP(s)
}
variable "allowed_smtp_cidrs" {
  type        = list(string)
  default     = ["0.0.0.0/0"] # tighten as needed
  description = "CIDRs allowed to connect to 25/465/587 on the relay"
}

# Postfix settings
variable "smtp_hostname" {
  type        = string
  default     = "mail-relay.example.com"
}
variable "relay_target_host" {
  type        = string
  description = "The NAS host/IP that Postfix will relay to (reachable over VPN). Example: 10.20.1.50 or nas.lan.local"
}
variable "relay_target_port" {
  type        = number
  default     = 25
}
variable "mynetworks_extra" {
  type        = list(string)
  default     = []
  description = "Extra networks allowed to relay (besides 127.0.0.0/8 and the public subnet)."
}

# DNS (optional)
variable "create_dns" {
  type        = bool
  default     = false
}
variable "route53_zone_id" {
  type        = string
  default     = null
  description = "Hosted zone ID for your domain (e.g., Z123ABC...). Required if create_dns = true"
}
variable "mail_hostname" {
  type        = string
  default     = "mail.guidogerbpublishing.com"
}
variable "mx_priority" {
  type        = number
  default     = 10
}
variable "spf_txt" {
  type        = string
  default     = "v=spf1 ip4:203.0.113.10 -all"
  description = "Example SPF. Replace with your relay EIP or broader policy."
}

# --- Option A: Site-to-Site VPN (default disabled) ---
variable "enable_s2s_vpn" {
  type    = bool
  default = false
}
variable "customer_gw_public_ip" {
  type        = string
  default     = null
  description = "Public IP of your Synology (or edge) for the Site-to-Site VPN Customer Gateway."
}
variable "customer_gw_bgp_asn" {
  type        = number
  default     = 65000
}
variable "on_prem_cidrs" {
  type        = list(string)
  default     = []
  description = "Your on-prem LAN(s) reachable over S2S (e.g. [\"192.168.1.0/24\"]). Used for static routes."
}

# --- Option B: Client VPN (default disabled) ---
variable "enable_client_vpn" {
  type    = bool
  default = false
}
variable "client_vpn_server_certificate_arn" {
  type        = string
  default     = null
  description = "ACM cert ARN for the Client VPN server."
}
variable "client_vpn_client_cidr" {
  type        = string
  default     = "10.50.0.0/22"
  description = "CIDR from which client IPs are allocated. Must NOT overlap VPC CIDRs."
}
variable "client_vpn_authorized_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "What client source CIDR is authorized to access the VPC (usually 0.0.0.0/0)."
}
```

---

## `main.tf`

```hcl
provider "aws" {
  region = var.region
}

# ----------------------------
# VPC, Subnets, IGW, NAT
# ----------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "mail-relay-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "mail-relay-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                          = aws_vpc.main.id
  cidr_block                      = var.public_subnet_cidr
  map_public_ip_on_launch         = true
  availability_zone               = data.aws_availability_zones.available.names[0]
  tags = { Name = "public-az1" }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "private-az1" }
}

data "aws_availability_zones" "available" {}

# Public RT: send 0.0.0.0/0 to IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# NAT for private subnet outbound
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  subnet_id     = aws_subnet.public.id
  allocation_id = aws_eip.nat.id
  tags          = { Name = "nat-gw" }
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "private-rt" }
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ----------------------------
# Security Groups
# ----------------------------
resource "aws_security_group" "smtp_relay" {
  name        = "smtp-relay-sg"
  description = "Allow SMTP/SMTPS/Submission + SSH"
  vpc_id      = aws_vpc.main.id

  # SSH
  dynamic "ingress" {
    for_each = toset(var.admin_ssh_cidrs)
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # SMTP family
  dynamic "ingress" {
    for_each = toset(var.allowed_smtp_cidrs)
    content {
      description = "SMTP 25"
      from_port   = 25
      to_port     = 25
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }
  dynamic "ingress" {
    for_each = toset(var.allowed_smtp_cidrs)
    content {
      description = "SMTPS 465"
      from_port   = 465
      to_port     = 465
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }
  dynamic "ingress" {
    for_each = toset(var.allowed_smtp_cidrs)
    content {
      description = "Submission 587"
      from_port   = 587
      to_port     = 587
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "All egress (NAS + updates)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "smtp-relay-sg" }
}

# ----------------------------
# SMTP Relay EC2 + EIP
# ----------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-server-*"]
  }
}

resource "aws_instance" "smtp_relay" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.smtp_relay.id]
  key_name                    = var.ssh_key_name
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data_smtp_relay.sh.tftpl", {
    smtp_hostname     = var.smtp_hostname
    public_subnet_cidr= var.public_subnet_cidr
    mynetworks_extra  = join(",", var.mynetworks_extra)
    relay_target_host = var.relay_target_host
    relay_target_port = var.relay_target_port
  })

  tags = { Name = "smtp-relay" }
}

resource "aws_eip" "smtp_relay" {
  domain   = "vpc"
  instance = aws_instance.smtp_relay.id
  tags     = { Name = "smtp-relay-eip" }
}

# ----------------------------
# Optional DNS (A + MX + SPF)
# ----------------------------
resource "aws_route53_record" "mail_a" {
  count   = var.create_dns ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.mail_hostname
  type    = "A"
  ttl     = 60
  records = [aws_eip.smtp_relay.public_ip]
}

resource "aws_route53_record" "mail_mx" {
  count   = var.create_dns ? 1 : 0
  zone_id = var.route53_zone_id
  name    = trimsuffix(var.mail_hostname, ".") # if you prefer apex, change name accordingly
  type    = "MX"
  ttl     = 300
  records = ["${var.mx_priority} ${var.mail_hostname}."]
}

resource "aws_route53_record" "spf_txt" {
  count   = var.create_dns ? 1 : 0
  zone_id = var.route53_zone_id
  name    = trimsuffix(var.mail_hostname, ".")
  type    = "TXT"
  ttl     = 300
  records = [var.spf_txt]
}

# ----------------------------
# Option A: Site-to-Site VPN
# ----------------------------
resource "aws_vpn_gateway" "vgw" {
  count  = var.enable_s2s_vpn ? 1 : 0
  vpc_id = aws_vpc.main.id
  tags   = { Name = "mail-relay-vgw" }
}

resource "aws_vpn_gateway_attachment" "vgw_attach" {
  count          = var.enable_s2s_vpn ? 1 : 0
  vpc_id         = aws_vpc.main.id
  vpn_gateway_id = aws_vpn_gateway.vgw[0].id
}

resource "aws_customer_gateway" "cgw" {
  count       = var.enable_s2s_vpn ? 1 : 0
  bgp_asn     = var.customer_gw_bgp_asn
  ip_address  = var.customer_gw_public_ip
  type        = "ipsec.1"
  tags        = { Name = "synology-cgw" }
  lifecycle {
    precondition {
      condition     = var.customer_gw_public_ip != null && length(var.customer_gw_public_ip) > 0
      error_message = "customer_gw_public_ip must be set for S2S."
    }
  }
}

resource "aws_vpn_connection" "vpn" {
  count                 = var.enable_s2s_vpn ? 1 : 0
  vpn_gateway_id        = aws_vpn_gateway.vgw[0].id
  customer_gateway_id   = aws_customer_gateway.cgw[0].id
  type                  = "ipsec.1"
  static_routes_only    = true
  tags                  = { Name = "synology-s2s" }
}

# Static routes to on-prem LAN(s)
resource "aws_vpn_connection_route" "on_prem" {
  for_each              = var.enable_s2s_vpn ? toset(var.on_prem_cidrs) : toset([])
  destination_cidr_block= each.value
  vpn_connection_id     = aws_vpn_connection.vpn[0].id
}

# Propagate routes to private route table (so instances in private subnet know how to reach on-prem)
resource "aws_vpn_gateway_route_propagation" "prop_private" {
  count          = var.enable_s2s_vpn ? 1 : 0
  vpn_gateway_id = aws_vpn_gateway.vgw[0].id
  route_table_id = aws_route_table.private.id
}

# ----------------------------
# Option B: Client VPN
# ----------------------------
resource "aws_ec2_client_vpn_endpoint" "cvpn" {
  count                       = var.enable_client_vpn ? 1 : 0
  description                 = "Synology -> VPC Client VPN"
  client_cidr_block           = var.client_vpn_client_cidr
  server_certificate_arn      = var.client_vpn_server_certificate_arn

  authentication_options {
    type = "certificate-authentication"
    root_certificate_chain_arn = var.client_vpn_server_certificate_arn
  }

  connection_log_options {
    enabled = false
  }

  split_tunnel = true
  dns_servers  = []
  tags         = { Name = "synology-client-vpn" }

  lifecycle {
    precondition {
      condition     = var.client_vpn_server_certificate_arn != null && length(var.client_vpn_server_certificate_arn) > 0
      error_message = "client_vpn_server_certificate_arn must be set for Client VPN."
    }
  }
}

resource "aws_ec2_client_vpn_network_association" "cvpn_assoc" {
  count               = var.enable_client_vpn ? 1 : 0
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.cvpn[0].id
  subnet_id              = aws_subnet.private.id
}

resource "aws_ec2_client_vpn_authorization_rule" "cvpn_auth" {
  count                    = var.enable_client_vpn ? 1 : 0
  client_vpn_endpoint_id   = aws_ec2_client_vpn_endpoint.cvpn[0].id
  target_network_cidr      = var.private_subnet_cidr
  authorize_all_groups     = true
  description              = "Allow clients to access private subnet"
}

# (Optional) Add a route from Client VPN to the private subnet (often implicit with association, but explicit is fine)
resource "aws_ec2_client_vpn_route" "cvpn_route" {
  count                    = var.enable_client_vpn ? 1 : 0
  client_vpn_endpoint_id   = aws_ec2_client_vpn_endpoint.cvpn[0].id
  destination_cidr_block   = var.private_subnet_cidr
  target_vpc_subnet_id     = aws_subnet.private.id
  depends_on               = [aws_ec2_client_vpn_network_association.cvpn_assoc]
}
```

---

## `user_data_smtp_relay.sh.tftpl`

```bash
#!/usr/bin/env bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y postfix ca-certificates libsasl2-modules fail2ban

# Basic Postfix config
postconf -e "myhostname = ${smtp_hostname}"
postconf -e "inet_interfaces = all"
postconf -e "smtpd_banner = \$myhostname ESMTP"
postconf -e "relayhost = [${relay_target_host}]:${relay_target_port}"

# Allow local + your public subnet + any extra ranges
# Note: include the VPC public subnet to allow the instance itself or ALB/NLB in front.
postconf -e "mynetworks = 127.0.0.0/8, ${public_subnet_cidr}${mynetworks_extra != "" ? ", ${mynetworks_extra}" : ""}"

# Basic anti-open-relay stance; tighten later as needed
postconf -e "smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination"

# Opportunistic TLS for inbound; STARTTLS on 587 if client supports it
postconf -e "smtpd_tls_security_level = may"
postconf -e "smtp_tls_security_level = may"
postconf -e "smtpd_use_tls = yes"
postconf -e "smtp_use_tls = yes"

# Submission & SMTPS services
sed -i 's/^#submission/submission/' /etc/postfix/master.cf || true
sed -i 's/^#smtps/smtps/' /etc/postfix/master.cf || true

systemctl enable postfix
systemctl restart postfix

# Minimal fail2ban jail for postfix (log path is Ubuntu default)
cat >/etc/fail2ban/jail.d/postfix.local <<'EOF'
[postfix]
enabled = true
port    = smtp,ssmtp,submission
logpath = /var/log/mail.log
maxretry = 6
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban
```

---

## `outputs.tf`

```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "private_subnet_id" {
  value = aws_subnet.private.id
}

output "smtp_relay_public_ip" {
  value = aws_eip.smtp_relay.public_ip
}

output "smtp_relay_public_dns" {
  value = aws_instance.smtp_relay.public_dns
}

output "smtp_relay_instance_id" {
  value = aws_instance.smtp_relay.id
}

output "vpn_connection_id" {
  value       = var.enable_s2s_vpn ? aws_vpn_connection.vpn[0].id : null
  description = "Present if Site-to-Site VPN is enabled"
}

output "client_vpn_endpoint_id" {
  value       = var.enable_client_vpn ? aws_ec2_client_vpn_endpoint.cvpn[0].id : null
  description = "Present if Client VPN is enabled"
}
```

---

# How to use

1. **Initialize**

```bash
cd terraform
terraform init
```

2. **Set your key vars** (example via tfvars)

```hcl
# terraform.tfvars
region               = "us-west-2"

relay_target_host    = "10.20.1.50" # Your Synology's reachable IP over VPN (or hostname)
relay_target_port    = 25

admin_ssh_cidrs      = ["203.0.113.55/32"]
allowed_smtp_cidrs   = ["0.0.0.0/0"] # lock down for production

smtp_hostname        = "mail-relay.guidogerbpublishing.com"

# DNS (optional)
create_dns           = true
route53_zone_id      = "Z123EXAMPLEID"
mail_hostname        = "mail.guidogerbpublishing.com"
spf_txt              = "v=spf1 ip4:REPLACE_WITH_EIP -all"

# Option A: Site-to-Site (example)
enable_s2s_vpn       = true
customer_gw_public_ip= "198.51.100.77"
on_prem_cidrs        = ["192.168.10.0/24"]

# Option B: Client VPN (instead of S2S)
# enable_client_vpn             = true
# client_vpn_server_certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/..."
# client_vpn_client_cidr        = "10.50.0.0/22"
```

3. **Apply**

```bash
terraform apply
```

---

## Notes & hardening checklist

- **Open relay prevention:** Keep `allowed_smtp_cidrs` tight (specific sending hosts only) or enforce SASL auth (not shown) before opening 587 to the world.
- **DKIM/DMARC:** Add DKIM (via your mail system signing) and a DMARC TXT in Route 53.
- **NACLs:** Security Groups usually suffice; add explicit NACL rules if your org requires them.
- **Monitoring:** Consider CloudWatch Agent + alarms on CPU/disk and log-based alarms on postfix rejects/bounces.
- **SSM:** Add an instance profile for SSM Session Manager (safer than exposing SSH).
- **Client VPN vs S2S:**
  - _S2S:_ your Synology remains on its LAN IP(s), reachable over the tunnel; add those LAN CIDRs in `on_prem_cidrs`.
  - _Client VPN:_ client receives an IP from `client_vpn_client_cidr`; routes/authorization allow access to `private_subnet_cidr`.

- **Synology config:** For S2S, configure IPsec (route-based) to match AWS proposals; for Client VPN, configure OpenVPN (mutual TLS) using the AWS-generated client config & certificates.

If you want, I can tailor this to your exact CIDR plan, add SSM/IAM, DKIM/DMARC records, or flip it to ARM (`t4g.micro`) + Ubuntu ARM AMI.
